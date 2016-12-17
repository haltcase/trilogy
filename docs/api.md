# Trilogy (`Class`)

```javascript
new Trilogy(path, [options])
```

Initialize a new datastore instance, creating an SQLite database
file at the provided `path` if it does not yet exist, or reading
it if it does.

**Arguments**
- `{string} path`:
  absolute or relative file path. If relative it is resolved against
  `process.cwd()`, or the `options.dir` property if it is provided.
- _optional_ `{Object} options`:

|     property    |     type    |     default     |                                    description                                |
|-----------------|:-----------:|:---------------:|-------------------------------------------------------------------------------|
| `dir`           |   `string`  | `process.cwd()` | The working directory with which to resolve `path`.                           |
| `verbose`       |  `Function` |   `() => {}`    | Receives every query run against the database.                                |
| `errorListener` |  `Function` |     `null`      | Function that if provided, receives any errors thrown during query execution. |

**Usage**

```javascript
import Trilogy from 'trilogy'

const db = new Trilogy('./storage.db')

// WITH OPTIONS:
// verbose function
const db = new Trilogy('./storage.db', {
  verbose: console.log.bind(console)
})

// errorListener function
function errorHandler (err) {
  if (err.message === `Trilogy#createTable :: 'columns' must be an Array, Object, or Function.`) {
    console.log('Crap. Should have read the docs!')
  }
}

const db = new Trilogy('./storage.db', {
  errorListener: errorHandler
})
```

**Throws**: if `path` is not provided.

## Methods

### count
```javascript
db.count(table, [column], [where], [options])
```

Count the number of rows, matching a criteria if specified.

**Arguments**
- `{string} table`
- _optional_ `{string} column`: column to select on
  - _optional_ `{Object | Array} where`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is either a key / value pair (equal to) or a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
  - _default_ = `{}`: no restriction on selection
- _optional_ `{Object} options`:

|     property    |     type    |     default     |                                    description                                |
|-----------------|:-----------:|:---------------:|-------------------------------------------------------------------------------|
| `distinct`      |  `boolean`  |     `false`     | Counts only unique values if `true`.                                          |

**Returns**: `Promise<number>` resolves to the number of rows found, matching criteria if specified.

**Usage**

Assuming we have this data in our `people` table:

|  name  |  age  |
|:------:|:-----:|
|  Bob   |  18   |
|  Dale  |  25   |
|  Harry |  32   |

```javascript
db.count('people')
// -> 3

db.count('people', ['age', '>', 21])
// -> 2

db.count('people', { age: 18 })
// -> 1
```

Now assume we have tables `people`, `places`, `things`, & `ideas`.
Thanks to function overloading we can do this to count number of
tables in the database:

```javascript
db.count()
// -> 4
```

Be aware of this gotcha in the API:

```javascript
db.count('people', 'name', { distinct: true })
// -> 0
// ??
```

In the case above, `{ distinct: true }` is being interpreted as the
`where` argument, since `where` can be an object just like `options`.
In cases like this, trilogy's function overloading won't be able to
differentiate them so you'll need to make it clear which is which.
If you want no `where` criteria for example, just provide an empty
object before the options argument:

```javascript
db.count('people', 'name', {}, { distinct: true })
// -> 3
```

### createTable
```javascript
db.createTable(name, schema, [options])
```

Add a table to the database with a schema described by
`schema`, the options of which are passed to knex.
Some attributes require no values, such as `primary` or
`nullable`. In these cases, their presence in the object
is enough to add that flag.

If any column property is not present in knex's methods
it will be ignored. See [knex's documentation](http://knexjs.org/#Schema-Building)
on Schema Building for the available attributes when
creating column tables.

**Arguments**
  - `{string} name`: name of the table to add
  - `{Object | Array | Function} schema`: describes the schema of the table
  - _optional_ `{Object} options`:

|     property    |       type      |     default     |                                               description                                          |
|-----------------|:---------------:|:---------------:|----------------------------------------------------------------------------------------------------|
| `compositeKey`  | `Array<string>` |      none       | Array of column names as strings. A composite primary key will be created on all of these columns. Not used with Function syntax. |

**Returns** `Promise`

**Usage**

`schema` can be supplied in Array form:

```javascript
// a string in the Array defaults to a text column in the table
db.createTable('people', ['email'])

// use an object to specify other attributes
db.createTable('people', [
  { name: 'age', type: 'integer' }
])

// you can mix and match
db.createTable('people', [
  'name',
  { name: 'age', type: 'integer' },
  'email',
  { name: 'uid', primary: true }
])
```

... or in Object form:

```javascript
db.createTable('people', {
  name: { type: 'text' },
  age: { type: 'integer' },
  email: { type: 'text' },
  uid: { type: 'integer', primary: true }
})
```

... or in Function form:

```javascript
let peopleSchema = function (person) {
  person.text('name')
  person.integer('age')
  person.text('email')
  person.integer('uid').primary()
}

db.createTable('people', peopleSchema)
```

Function form offers the full schema building power of
[knex](https://knexjs.org/#Schema-Building), so you can
use it to create schemas in ways that the other forms
may not abstract over.

### decrement
```javascript
db.decrement(table, [column], [amount], [where], [allowNegative])
```

Decrement a value at `column` by a specified `amount`.
Allows function overloading, ie. `table` is the only
required argument. In that case, column must be provided
as part of `table` using dot- or bracket-notation. This
allows for a short-and-sweet syntax in the case you only
want to decrement by 1.

**Arguments**
  - `{string} table`
  - _optional_ `{string} column`: If this argument is not explicitly provided, it must be included as part of `table` using either dot- or bracket-notation.
  - _optional_ `{number} amount`
    - _default_ = `1`
  - _optional_ `{Object | Array} where`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is either a key / value pair (equal to) or a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    - _default_ = `{}`: no restriction on selection
  - _optional_ `{boolean} allowNegative`: unless set to `true`, the value will not be allowed to go below a value of `0`.
    - _default_ = `false`

**Returns** `Promise`

**Usage**

```javascript
db.decrement('people', 'age', 1, { name: 'Bob' })

// we can make that a little sweeter:
db.decrement('people.age', { name: 'Bob' })
```

### del
```javascript
db.del(table, [where], [all])
```

Delete rows from a table. Allows deletion of all records
in a table by passing only a table name and `true` as the
second parameter.

**Arguments**
  - `{string} table`
  - _optional_ `{Object | Array} where`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is either a key / value pair (equal to) or a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    - _default_ = `{}`: no restriction on selection
  - _optional_ `{boolean} all`: set to `true` to remove all rows
    - _default_ = `false`

**Returns** `Promise<number>`

**Usage**

```javascript
// delete only where age is under 21
db.del('people', ['age', '<', '21'])

// delete only those whose name is 'Bob'
db.del('people', { name: 'Bob' })

// delete all records from 'people'
db.del('people', true)
```

### dropTable
```javascript
db.dropTable(name)
```

Remove the specified table from the database.

**Arguments**
  - `{string} name`: name of the table to drop

**Returns** `Promise`

**Usage**

```javascript
db.dropTable('people').then(() => {
  // the table doesn't exist anymore
})
```

### first
```javascript
db.first(table, [columns], [where], [options])
```

Return the first row selected by the query. Allows overloading
of arguments, ie. `table` is the only required argument. In this
case, `columns` defaults to selecting all columns.

**Arguments**
  - `{string} table`
  - _optional_ `{string | Array<string>} columns`: defaults to selecting all columns
  - _optional_ `{Object | Array} where`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is either a key / value pair (equal to) or a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    - _default_ = `{}`: no restriction on selection
  - _optional_ `{Object} options`:

|     property    |     type    |     default     |                                    description                                |
|-----------------|:-----------:|:---------------:|-------------------------------------------------------------------------------|
| `random`        |  `boolean`  |     `false`     | Pass `true` to return a random record.                                        |

**Returns** `Promise<number>`

**Usage**

### getValue
```javascript
db.getValue(table, [column], [where])
```

Retrieve the value at a specific row in a specific column.
Allows function overloading, ie. `table` is the only required
argument. In this case, `column` must be provided as dot- or
bracket-notation syntax of `table.column` or `table[column]`.

**Arguments**
  - `{string} table`
  - _optional_ `{Object | Array} where`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is either a key / value pair (equal to) or a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    - _default_ = `{}`: no restriction on selection

**Returns** `Promise<number>`

**Usage**

```javascript
db.getValue('people', 'age', { name: 'Bob' })

// dot- or bracket-notation of table and column
db.getValue('people.age', { name: 'Bob' })
db.getValue('people[age]', { name: 'Bob' })
```

### hasTable
```javascript
db.hasTable(name)
```

Check if a table exists in the database.

**Arguments**
  - `{string} name`: name of the table to check for

**Returns** `Promise<boolean>`

**Usage**

```javascript
db.hasTable('coffee_shops').then(has => {
  if (has) {
    console.log(`We're good!`)
  }
})
```

### increment
```javascript
db.increment(table, [column], [amount], [where])
```

Increment a value at `column` by a specified `amount`.
Allows function overloading, ie. `table` is the only
required argument. In that case, column must be provided
as part of `table` using dot- or bracket-notation. This
allows for a short-and-sweet syntax in the case you only
want to increment by 1.

**Arguments**
  - `{string} table`
  - _optional_ `{Object | Array} where`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is either a key / value pair (equal to) or a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    - _default_ = `{}`: no restriction on selection

**Returns** `Promise`

**Usage**

```javascript
// happy birthday Bob!
db.increment('people', 'age', 1, { name: 'Bob' })

// we can make that much sweeter:
db.increment('people.age', { name: 'Bob' })
```

### insert
```javascript
db.insert(table, values, [options])
```

Insert values into a table in the database.

**Arguments**
  - `{string} table`

**Returns** `Promise`

**Usage**

```javascript
db.insert('people', {
  name: 'Bob',
  age: 17,
  favorite_color: 'blue'
})

// insert or replace
// relies on the table schema having a unique restriction
db.insert('people', {
  name: 'Bob',
  age: 17,
  favorite_color: 'red'
}, { conflict: 'replace' })
```

### raw
```javascript
db.raw(query, [ret])
```

Execute arbitrary SQLite queries. You can either write your
own queries as you would with typical SQLite, or you can build
them with knex. Trilogy makes this easy with [`.queryBuilder`](/api#querybuilder) and [`.schemaBuilder`](/api#schemabuilder).

**Arguments**
  - `{Object | string} query`: any SQLite query string. If an Object is provided,
    a `toString` conversion will be attempted in the case it's a knex query object.
  - _optional_ `{boolean} ret`: whether to return the results of the query
    - _default_ = `false`

**Returns** `Promise<number>`

**Usage**

```javascript
let query =
  `select * from "users" ` +
  `inner join "accounts" on "accounts"."id" = "users"."account_id" ` +
  `or "accounts"."owner_id" = "users"."id"`

db.raw(query, true)
```

Or using [`.queryBuilder`](/api#querybuilder):

```javascript
let query = db.queryBuilder.table('users').innerJoin('accounts', function () {
  this.on('accounts.id', '=', 'users.account_id').orOn('accounts.owner_id', '=', 'users.id')
})

db.raw(query, true)
```

### select
```javascript
db.select(table, [columns], [where], [options])
```

Execute a select query on the database. Allows overloading of arguments,
ie. `table` is the only required argument. In this case, `columns`
defaults to selecting all columns.

**Arguments**
  - `{string} table`
  - _optional_ `{string | Array<string>} columns`: Defaults to selecting all columns.
    - _default_ = `['*']`
  - _optional_ `{Object | Array} where`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is either a key / value pair (equal to) or a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    - _default_ = `{}`: no restriction on selection
  - _optional_ `{Object} options`:

|     property    |     type    |     default     |                                    description                                |
|-----------------|:-----------:|:---------------:|-------------------------------------------------------------------------------|
| `random`        |  `boolean`  |     `false`     | Pass `true` to return a random record.                                        |

**Returns** `Promise<number>`

**Usage**

```javascript
// select all records in the 'people' table
db.select('people')

// select just the 'age' and 'favorite_color' columns where name is 'Bob'
db.select('people', ['age', 'favorite_color'], { name: 'Bob' })

// select just 'name' where age is at least 18
db.select('people', 'age', ['age', '>=', '18'])
```

### update
```javascript
db.update(table, values, [where], [options])
```

Update rows in the database.

**Arguments**
  - `{string} table`
  - `{Object | Array} values`: must either be an Object or a key / value Array `(length === 2)`
  - _optional_ `{Object | Array} where`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is either a key / value pair (equal to) or a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    - _default_ = `{}`: no restriction on selection
  - _optional_ `{Object}`:

|     property    |     type    |     default     |                                    description                                    |
|-----------------|:-----------:|:---------------:|-----------------------------------------------------------------------------------|
|    `conflict`   |   `string`  |      none       | an SQLite conflict type, one of: `fail`, `abort`, `ignore`, `replace`, `rollback` |

**Returns** `Promise<number>`

**Usage**

```javascript
await db.insert('who_on_first', {
  first: 'who',
  second: 'what',
  pitcher: 'tomorrow'
})

await db.update('who_on_first', {
    // update the value of 'first' to 'naturally'
    first: 'naturally'
  }, {
    // where 'second' is equal to 'what'
    second: 'what'
  })
})

// "Now you've got it."
// 'who_on_first.first' is now equal to 'naturally'
```

## Properties

### coercion

A boolean value controlling the way trilogy will coerce boolean values when inserting, updating, or retreiving data from the database. SQLite does not have a native `boolean` column type, so you have to use either `integer` where `true` is `1` and `false` is `0` or a `string` variant.

By default, trilogy coerces booleans to strings and back automatically. If you'd rather they be treated more like SQLite's standard `integer` behavior, set `db.coercion = false` or pass `{ coercion: false }` in the constructor options object.

```javascript
const db = new Trilogy('./test.db', { coercion: false })

db.coercion = true
```

### queryBuilder

Exposes the knex query building interface. See the
[knex documentation](http://knexjs.org/#Builder) for
more info. `db.queryBuilder.[methodName]` with trilogy
is equivalent to `knex.[methodName]` in that documentation.

This is useful for situations where knex's chainable
interface allows you to build queries that either aren't
possible with trilogy's API or wouldn't make sense to
abstract over since the chain can be more powerful.

To run queries written with this, see [`#raw`](/api#raw)

**Usage**
```javascript
let query = db.queryBuilder.avg('sum_column1').from(function() {
  this.sum('column1 as sum_column1').from('t1').groupBy('column1').as('t1')
}).as('ignored_alias')

db.raw(query)
```

### schemaBuilder

Exposes the knex schema building interface. See the
[knex documentation](http://knexjs.org/#Schema) for
more info. `db.schemaBuilder.[methodName]` with trilogy
is equivalent to `knex.schema.[methodName]` in that
documentation.

To run queries written with this, see [`#raw`](/api#raw)

**Usage**
```javascript
let query = db.schemaBuilder.renameTable('users', 'old_users')

db.raw(query)
```