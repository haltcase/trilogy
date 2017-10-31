# Trilogy (`Class`)

```js
new Trilogy(path, [options])
```

Initialize a new datastore instance, creating a SQLite database
file at the provided `path` if it does not yet exist, or reading
it if it does.

Trilogy can use both the native `sqlite3` module or `sql.js` -
the latter does not require compiling, whereas the former must
be built against its runtime environment. The goal is that the
difference should be invisible to you, so usage from Trilogy's
standpoint stays the same no matter which one you choose. You
should also be able to change it at any time without any hitches.

If `path` is exactly `':memory:'`, no file will be created and
an in-memory store will be used. This doesn't persist any of the
data.

See ["Choosing a Backend"](/backends) for more on how these two
modules may differ.

> **Arguments**

- `{string} path`:
  absolute or relative file path. If relative it is resolved against
  `process.cwd()`, or the `options.dir` property if it is provided.
- _optional_ `{Object} options`:

| property  | type       | default         | description                                         |
| --------- | :-------:  | :-------------: | --------------------------------------------------- |
| `client`  | `string`   | `sqlite3`       | Must be one of `sqlite3` or `sql.js`.               |
| `dir`     | `string`   | `process.cwd()` | The working directory with which to resolve `path`. |
| `verbose` | `Function` | `() => {}`      | Receives every query run against the database.      |

> **Usage**

```js
import Trilogy from 'trilogy'

// defaults to using `sqlite3`
const db = new Trilogy('./storage.db')
```

With an options object:

```js
const db = new Trilogy('./storage.db', {
  // use `sql.js` to avoid build issues like gyp
  client: 'sql.js',

  // directory with which to resolve `path`
  // it defaults to `process.cwd()`
  dir: path.resolve('./here'),

  // pass a function that receives all queries run
  verbose: console.log.bind(console)
})
```

> **Throws**

if `path` is not provided.

## Methods

### model
```js
db.model(name, schema, [options])
```

Define a new model with the provided `schema`, or return the
existing model if one is already defined with `name`.

Each property of `schema` describes a column, where its key is
the name of the column and its value describes its attributes.
The value can be either a type, such as `String`, `Number`, or
`'increments'`, or a more descriptive object. See the docs on
[column descriptors](/api#column-descriptor) for more information.

This schema controls the handling of values inserted into and
retreived from the database, casting them as needed. For example,
SQLite does not support a Boolean data type and instead stores
them as integers. Trilogy will transparently cast Booleans to
integers when inserting them and back to Booleans when retreiving
them. The same goes for all other [supported data types](/api#valid-column-types).

If any property of `schema` is not present in knex's methods
it will be ignored. See [knex's documentation](http://knexjs.org/#Schema-Building)
on Schema Building for the available attributes when creating column tables.

> **Arguments**

  - `{string} name`: name of the model
  - `{Object} schema`: describes the schema of the table
  - _optional_ `{Object} options`:

|  property    | type            | default | description                      |
| ------------ | :-------------: | :-----: | -------------------------------- |
| `timestamps` | `boolean`       | -       | When `true`, adds `created_at` and `updated_at` properties, both defaulting to the current timestamp. |
|  `primary`   | `Array<string>` | -       | An Array of column names to specify as a composite primary key. |
|  `unique`    | `Array<string>` | -       | An Array of column names on which to apply unique constraints. |
|  `index`     | `string`, `Array<string>`, `Array<Array<string>>`, `Object` | - | See ["advanced indexing"](/api#advanced-indexing) |

_Note: specifying a column as either `primary` or `unique` in both the column
descriptor and the `options.primary` or `options.unique` Arrays will result
in an error, as the constraint will have already been applied._

> **Returns**

`Promise<`[`Model`](/api#model-class)`>`

> **Usage**

```js
db.model('people', {
  name: String,
  age: Number,
  email: String,
  uid: { type: Number, primary: true }
})

db.find('people', { /* ... */ })
db.create('people', { /* ... */ })
db.min('people.age', { /* ... */ })

// already defined, so it's returned
const people = db.model('people')

// since `model()` returns a model instance,
// you can use methods on that instance like so:
people.find({ /* ... */ })
people.create({ /* ... */ })
people.min('age', { /* ... */ })
```

### hasModel
```js
db.hasModel(name)
```

First checks if the model's been defined with Trilogy, then
runs an existence query on the database, returning `true` if
the table exists or `false` if it doesn't.

> **Arguments**

  - `{string} name`: the name of the model to check

> **Returns**

`Promise<boolean>`

> **Usage**

```js
db.hasModel('people')
  .then(has => {
    if (has) {
      console.log('it exists!')
    }
  })
```

### dropModel
```js
db.dropModel(name)
```

Removes the specified model from Trilogy's definition and the database.

> **Arguments**

  - `{string} name`: the name of the model to remove

> **Returns**

`Promise`

> **Usage**

```js
db.dropModel('people')
  .then(() => {
    // model & table dropped
  })
```

### raw
```js
db.raw(query, needResponse)
```

Allows running any arbitrary query generated by Trilogy's [`.knex`](/api#knex)
instance. If the result is needed, pass `true` as the second argument, otherwise
the number of affected rows will be returned ( if applicable ).

> **Arguments**

  - `{KnexQuery} query`: any knex query created with [`.knex`](/api#knex)
  - `{boolean} needResponse`: whether to return the result of the query

> **Returns**

`Promise<mixed>`

> **Usage**

```js
const query = db.knex('users')
  .innerJoin('accounts', function () {
    this.on('accounts.id', '=', 'users.account_id')
      .orOn('accounts.owner_id', '=', 'users.id')
  })

db.raw(query, true).then(result => {})
```

### close
```js
db.close()
```

Drains the connection pools and releases connections to any open
database files. This should always be called at the end of your
program to gracefully shut down, and only once since the connection
can't be reopened.

> **Arguments**

None

> **Returns**

`Promise`

> **Usage**

```js
import Trilogy from 'trilogy'

const db = new Trilogy('./file.db')

db.find('title', ['release', '>', 2001])
  .then(titles => {
    return titles.map(title => {
      return doSomething(title)
    })
  })

// sometime later ... program ending ...
db.close().then(() => {
  // database connection ended
})
```

## Properties

### models

An array of all model names defined on the instance.

> **Type**

`Array<string>`

### knex

Exposes Trilogy's knex instance to allow more complex query building.
You can use this to create queries that aren't necessarily feasible
with Trilogy's API, like nested where clauses that require functions
as arguments.

**IMPORTANT**: Do _not_ call `then` or otherwise execute the query.
Pass the knex query object as-is to [`raw()`](/api#raw) for execution.

All of the following methods will cause execution when chained to a
knex query, so avoid using these when building raw queries you intend
to run with Trilogy:

- Promises: `then`, `catch`, `tap`, `map`, `reduce`, `bind`, `return`
- Callbacks: `asCallback`
- Streams: `stream`, `pipe`

The following methods shouldn't cause problems, but they aren't
guaranteed to work, especially when using `sql.js`:

- Events: `on` [`'query'`, `'query-error'`, `'query-response'`]

And finally the following methods will work just fine, but you should
not chain them on a query object before passing it to Trilogy. Running
them separately is fine:

- Other: `toString`, `toSQL`

For more advanced usage, see [knex's own documentation](http://knexjs.org/).

> **Usage**

```js
import Trilogy from 'trilogy'

const db = new Trilogy('./file.db')

const query = db.knex('users').select('*')
console.log(query.toString())

db.raw(query, true).then(users => {})
```

More complex queries are possible this way:

```js
const query = db.knex('users')
  .innerJoin('accounts', function () {
    this.on('accounts.id', '=', 'users.account_id')
      .orOn('accounts.owner_id', '=', 'users.id')
  })

db.raw(query, true).then(result => {})
```

_Don't_ do the following, as it will cause query execution.

```js
db.knex('users').select('*')
  .then(() => {})
```

# Model (`Class`)

Model instances are created using [`model()`](/api#model).
All model instance methods are also accessible at the top
level of a trilogy instance, meaning the following calls are
equivalent:

```js
// given this setup:
const db = new Trilogy('./storage.db')
const users = await db.model('users', { /* some schema */ })

// these are equivalent:
db.find('users', { name: 'citycide' })
users.find({ name: 'citycide' })
```

The function signatures remain the same except you provide
the model name and, in some cases, the column name, as the
first argument. Column names should be passed along with
the table in dot-notation, ie. `'users.name'`.

## Methods

### create
```js
model.create(object, [options])
```

Insert an object into the table. `object` should match the
model's defined schema, values will cast into types as needed.
If a unique or primary constraint exists on a property the
insert will be ignored when violating this constraint.

> **Arguments**

  - _optional_ `{Object} object`: the data to insert
  - _optional_ `{Object} options`

| property | type      | default | description                               |
| -------- | :-------: | :-----: | ----------------------------------------- |
| `raw`    | `boolean` | `false` | If `true`, will bypass getters & setters. |

> **Returns**

`Promise<Object>`: the created object

> **Usage**

```js
players.create({
  id: 197397332,
  username: 'xX420_sniperXx',
  friends: ['xX420_kniferXx']
}).then(object => {
  console.log(object)
  // { id: 197397332,
  //   username: 'xX420_sniperXx',
  //   friends: ['xX420_kniferXx'] }
})
```

### find
```js
model.find([column], [criteria], [options])
```

Find all objects matching `criteria`. If `column` is provided, the resulting
array will contain only the `column` property of the found objects.

> **Arguments**

  - _optional_ `{string} column`: if provided, only this column's value will be selected
  - _optional_ `{Object | Array} criteria`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is one of:
      - a length of 2, ie. a key / value pair (equal to)
      - a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
      - a list containing any number of the above forms
  - _optional_ `{Object} options`:

| property | type                        | default | description                                                                         |
| -------- | :-------------------------: | :-----: | ----------------------------------------------------------------------------------- |
| `random` | `boolean`                   | `false` | Select a single random record.                                                      |
| `order`  | `string`, `[string, string]` | -       | Specify a selection order. See [the knex docs](http://knexjs.org/#Builder-orderBy). |
| `limit`  | `number`                    | -       | Limit the rows returned.                                                            |
| `skip`   | `number`                    | -       | Skip (offset) a number of records.                                                  |
| `raw`    | `boolean`                   | `false` | If `true`, will bypass getters & setters.                                           |

_Note: if `options.random` is provided, `options.order` is ignored._

> **Returns**

`Promise<Array<Object | mixed>>`: array of found objects, or `object[column]` if a column was provided

> **Usage**

```js
const todos = await db.model('todos', {
  name: String,
  body: String,
  priority: Number
})

await Promise.all([
  todos.create({ name: 'code', body: 'create the best thing', priority: 1 }),
  todos.create({ name: 'docs', body: 'crap what did I create', priority: 2 }),
  todos.create({ name: 'tests', body: 'totally works', priority: 3 })
])

todos.find('name', ['priority', '<', 3]).then(found => {
  console.log(found)
  // -> ['code', 'docs']
})
```

### findOne
```js
model.findOne([column], [criteria], [options])
```

Find a single object. Returns either the object or, if `column` is
provided, the value at `object[column]`.

> **Arguments**

  - _optional_ `{string} column`: if provided, only this column's value will be selected
  - _optional_ `{Object | Array} criteria`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is one of:
      - a length of 2, ie. a key / value pair (equal to)
      - a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
      - a list containing any number of the above forms
  - _optional_ `{Object} options`:

| property | type                        | default | description                                                                         |
| -------- | :-------------------------: | :-----: | ----------------------------------------------------------------------------------- |
| `random` | `boolean`                   | `false` | Select a single random record.                                                      |
| `order`  | `string`, `[string, string]` | -       | Specify a selection order. See [the knex docs](http://knexjs.org/#Builder-orderBy). |
| `skip`   | `number`                    | -       | Skip (offset) a number of records.                                                  |
| `raw`    | `boolean`                   | `false` | If `true`, will bypass getters & setters.                                           |

_Note: if `options.random` is provided, `options.order` is ignored._

> **Returns**

`Promise<Object | mixed>`: the found object, or `object[column]` if a column was provided

> **Usage**

```js
const todos = await db.model('todos', {
  name: String,
  body: String,
  priority: Number
})

await Promise.all([
  todos.create({ name: 'code', body: 'create the best thing', priority: 1 }),
  todos.create({ name: 'docs', body: 'crap what did I create', priority: 2 }),
  todos.create({ name: 'tests', body: 'totally works', priority: 3 })
])

todos.findOne('body', { name: 'docs' }).then(found => {
  console.log(found)
  // -> 'crap what did I create'
})
```

### findOrCreate
```js
model.findOrCreate(criteria, creation, [options])
```

Find a matching object based on `criteria`, or create it if it doesn't
exist. When creating the object, a merged object created from `criteria`
and `creation` will be used, with the properties from `creation` taking
precedence.

> **Arguments**

  - `{Object} criteria`: criteria to search for
  - `{Object} creation`: data used to create the object if it doesn't exist
  - _optional_ `{Object} options`: same as [`findOne()`](/api#findOne)

> **Returns**

`Promise<Object>`: the found object, after creation if necessary

> **Usage**

```js
const people = await db.model('people', {
  name: { type: String, primary: true },
  age: Number,
  adult: Boolean
})

people.findOrCreate({ name: 'Joe' }, { age: 13, adult: false }).then(person => {
  console.log(person)
  // -> { name: 'Joe', age: 13, adult: false }
})
```

### update
```js
model.update([criteria], data, [options])
```

Modify the properties of an existing object.

> **Arguments**

  - _optional_ `{Object | Array} criteria`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is one of:
      - a length of 2, ie. a key / value pair (equal to)
      - a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
      - a list containing any number of the above forms
  - `{Object} data`: the updates to be made
  - _optional_ `{Object} options`

| property | type      | default | description                               |
| -------- | :-------: | :-----: | ----------------------------------------- |
| `raw`    | `boolean` | `false` | If `true`, will bypass getters & setters. |

> **Returns**

`Promise<number>`: the number of rows affected

> **Usage**

```js
const games = await db.model('games', {
  name: { type: String, primary: true },
  genre: String,
  owned: Boolean
})

await games.create({ name: 'Overwatch', genre: 'FPS', owned: false })

games.update({ name: 'Overwatch' }, { owned: true }).then(rowsAffected => {
  console.log(rowsAffected)
  // -> 1
})
```

### updateOrCreate
```js
model.updateOrCreate(criteria, data, [options])
```

Update an existing object or create it if it doesn't exist. If creation
is necessary a merged object created from `criteria` and `data` will be
used, with the properties from `data` taking precedence.

> **Arguments**

  - `{Object} criteria`: criteria to search for
  - `{Object} data`: updates to be made, or used for object creation
  - _optional_ `{Object} options`: same as [`update()`](/api#update)

> **Returns**

`Promise<number>`: the number of rows affected

> **Usage**

```js
const games = await db.model('games', {
  name: { type: String, primary: true },
  genre: String,
  owned: Boolean
})

const rowsUpdated = await games.updateOrCreate(
  { name: 'Ms. PacMan' },
  { owned: false, genre: 'arcade' }
)
// -> 1

await games.findOne({ name: 'Ms. PacMan' })
// -> { name: 'Ms. PacMan', owned: false, genre: 'arcade' }
```

### get
```js
model.get(column, criteria, [defaultValue])
```

Works similarly to the `get` methods in lodash, underscore, etc. Returns
the value at `column` or, if it does not exist, the supplied `defaultValue`.

> **Arguments**

  - `{string} column`: the property to retrieve
  - _optional_ `{Object | Array} criteria`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is one of:
      - a length of 2, ie. a key / value pair (equal to)
      - a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
      - a list containing any number of the above forms
  - _optional_ `{mixed} defaultValue`: returned if the result doesn't exist

> **Returns**

`Promise<mixed>`

> **Usage**

```js
const todos = await db.model('todos', {
  name: String,
  body: String,
  priority: Number
})

await Promise.all([
  todos.create({ name: 'code', body: 'create the best thing', priority: 1 }),
  todos.create({ name: 'docs', body: 'crap what did I create', priority: 2 }),
  todos.create({ name: 'tests', body: 'totally works', priority: 3 })
])

await todos.get('priority', { name: 'code' })
// -> 1

// with default value
await todos.get('priority', { name: 'eat' }, 999)
// -> 999
```

### set
```js
model.set(column, criteria, value)
```

Works similarly to the `set` methods in lodash, underscore, etc. Updates
the value at `column` to be `value` where `criteria` is met.

> **Arguments**

  - `{string} column`: the column to update
  - _optional_ `{Object | Array} criteria`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is one of:
      - a length of 2, ie. a key / value pair (equal to)
      - a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
      - a list containing any number of the above forms
  - `{mixed} value`: the new value

> **Returns**

`Promise<number>`: the number of rows affected

> **Usage**

```js
const todos = await db.model('todos', {
  name: String,
  body: String,
  priority: Number
})

await Promise.all([
  todos.create({ name: 'code', body: 'create the best thing', priority: 1 }),
  todos.create({ name: 'docs', body: 'crap what did I create', priority: 2 }),
  todos.create({ name: 'tests', body: 'totally works', priority: 3 })
])

await todos.set('priority', { name: 'docs' }, 40)
// -> 1

await todos.set('body', ['priority', '>', 1], 'not important ;)')
// -> 2
```

### getRaw
```js
model.getRaw(column, criteria, [defaultValue])
```

Works exactly like [`get()`](/api#get) but bypasses getters and retrieves
the raw database value.

> **Arguments**

  - `{string} column`: the property to retrieve
  - _optional_ `{Object | Array} criteria`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is one of:
      - a length of 2, ie. a key / value pair (equal to)
      - a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
      - a list containing any number of the above forms
  - _optional_ `{mixed} defaultValue`: returned if the result doesn't exist

> **Returns**

`Promise<mixed>`

> **Usage**

```js
const todos = await db.model('todos', {
  name: String,
  body: String,
  priority: {
    type: Number,
    get: priority => { throw new Error('wrecked') }
  }
})

await Promise.all([
  todos.create({ name: 'code', body: 'create the best thing', priority: 1 }),
  todos.create({ name: 'docs', body: 'crap what did I create', priority: 2 }),
  todos.create({ name: 'tests', body: 'totally works', priority: 3 })
])

await todos.getRaw('priority', { name: 'code' })
// -> 1

// with default value
await todos.getRaw('priority', { name: 'eat' }, 999)
// -> 999

// using the non-raw method fires the getter
// this causes the error above to be thrown

await todos.get('priority', { name: 'code' })
// -> Error: 'wrecked'
```

### setRaw
```js
model.setRaw(column, criteria, value)
```

Works exactly like [`set()`](/api#set) but bypasses setters when
updating the target value.

> **Arguments**

  - `{string} column`: the column to update
  - _optional_ `{Object | Array} criteria`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is one of:
      - a length of 2, ie. a key / value pair (equal to)
      - a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
      - a list containing any number of the above forms
  - `{mixed} value`: the new value

> **Returns**

`Promise<number>`: the number of rows affected

> **Usage**

```js
const todos = await db.model('todos', {
  name: String,
  body: {
    type: String,
    set: body => { throw new Error('watch your back') }
  },
  priority: {
    type: Number,
    set: priority => { throw new Error('check yourself') }
  }
})

await Promise.all([
  todos.create({ name: 'code', body: 'create the best thing', priority: 1 }),
  todos.create({ name: 'docs', body: 'crap what did I create', priority: 2 }),
  todos.create({ name: 'tests', body: 'totally works', priority: 3 })
])

await todos.setRaw('priority', { name: 'docs' }, 40)
// -> 1

await todos.setRaw('body', ['priority', '>', 1], 'not important ;)')
// -> 2

// using the non-raw method fires the setters
// this causes the errors above to be thrown

await todos.set('priority', { name: 'docs' }, 50)
// -> Error: 'watch your back'

await todos.set('body', ['priority', '>', 1], 'not important ;)')
// -> Error: 'check yourself'
```

### incr
```js
model.incr(column, criteria, [amount = 1])
```

Increment a value at `column` by a specified `amount`, which defaults
to `1` if not provided.

> **Arguments**

  - `{string} column`: the target value
  - _optional_ `{number} amount`
    - _default_ = `1`
  - _optional_ `{Object | Array} criteria`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is one of:
      - a length of 2, ie. a key / value pair (equal to)
      - a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
      - a list containing any number of the above forms

> **Returns**

`Promise<number>`: the number of rows affected

> **Usage**

```js
// the amount defaults to 1, so these are equivalent
people.increment('age', { name: 'Bob' }, 1)
people.increment('age', { name: 'Bob' })

// happy birthday, Bob!
```

### decr
```js
model.decr(column, criteria, [amount = 1], [allowNegative = false])
```

Decrement a value at `column` by a specified `amount`, which defaults
to `1` if not provided. To allow the target value to dip below `0`,
pass `true` as the final argument.

> **Arguments**

  - `{string} column`: the target value
  - _optional_ `{number} amount`
    - _default_ = `1`
  - _optional_ `{Object | Array} criteria`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is one of:
      - a length of 2, ie. a key / value pair (equal to)
      - a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
      - a list containing any number of the above forms
  - _optional_ `{boolean} allowNegative`: unless set to `true`, the value will not be allowed to go below a value of `0`.
    - _default_ = `false`

> **Returns**

`Promise<number>`: the number of rows affected

> **Usage**

```js
// the amount defaults to 1, so these are equivalent
people.decrement('age', { name: 'Benjamin Button' }, 1)
people.decrement('age', { name: 'Benjamin Button' })

// to allow negative values as a result of this query:
people.decrement('age', { name: 'Benjamin Button' }, 1, true)
people.decrement('age', { name: 'Benjamin Button' }, true)
```

### remove
```js
model.remove(criteria)
```

Delete a row from the table matching `criteria`. If `criteria` is
empty or absent, nothing will be done. This is a safeguard against
unintentionally deleting everything in the table. Use
[`#clear()`](/api#clear) if you want to remove all rows.

> **Arguments**

  - `{Object | Array} criteria`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is one of:
      - a length of 2, ie. a key / value pair (equal to)
      - a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
      - a list containing any number of the above forms

> **Returns**

`Promise<number>`: the number of rows affected

> **Usage**

```js
users.remove({ expired: true })
```

### clear
```js
model.clear()
```

Removes all rows from the table.

> **Returns**

`Promise<number>`: the number of rows affected

### count
```js
model.count([column], [criteria], [options])
```

Count the number of rows, matching `criteria` if specified.

> **Arguments**

  - _optional_ `{string} column`: column to select on
  - _optional_ `{Object | Array} criteria`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is one of:
      - a length of 2, ie. a key / value pair (equal to)
      - a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
      - a list containing any number of the above forms
  - _optional_ `{Object} options`:

|  property   | type       | default | description                      |
| ----------- | :--------: | :-----: | -------------------------------- |
|  `distinct` | `boolean`  | `false` | Counts only unique values if `true`. |
|  `group`    | `string`   | -       | Add a group clause to the query. |

> **Returns**

`Promise<number>`: the number of rows found, matching `criteria` if specified.

> **Usage**

Assuming we have this data in our `people` table:

|  name  |  age  |
|:------:|:-----:|
|  Bob   |  18   |
|  Dale  |  25   |
|  Harry |  32   |

```js
people.count()
// -> 3

people.count(['age', '>', 21])
// -> 2

people.count({ age: 18 })
// -> 1
```

Now assume we've defined models `people`, `places`, `things`, & `ideas`.
If we use `count()` with no arguments on the Trilogy instance we can count
the number of tables in the database:

```js
db.count()
// -> 4
```

### min
```js
model.min(column, [criteria], [options])
```

Find the minimum value contained in the model, comparing all values
in `column` that match `criteria`.

> **Arguments**

  - _optional_ `{string} column`: column to compare
  - _optional_ `{Object | Array} criteria`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is one of:
      - a length of 2, ie. a key / value pair (equal to)
      - a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
      - a list containing any number of the above forms
  - _optional_ `{Object} options`:

| property | type     | default | description                      |
| -------- | :------: | :-----: | -------------------------------- |
| `group`  | `string` | -       | Add a group clause to the query. |

> **Returns**

`Promise<number>`: the minimum number found by the query

> **Usage**

Given this data in the `people` model:

|  name  |  age  |
|:------:|:-----:|
|  Bob   |  18   |
|  Dale  |  25   |
|  Harry |  32   |

```js
people.min('age')
// -> 18
```

### max
```js
model.max(column, [criteria], [options])
```

Find the maximum value contained in the model, comparing all values
in `column` that match `criteria`.

> **Arguments**

  - _optional_ `{string} column`: column to compare
  - _optional_ `{Object | Array} criteria`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is one of:
      - a length of 2, ie. a key / value pair (equal to)
      - a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
      - a list containing any number of the above forms
  - _optional_ `{Object} options`:

| property | type     | default | description                      |
| -------- | :------: | :-----: | -------------------------------- |
| `group`  | `string` | -       | Add a group clause to the query. |

> **Returns**

`Promise<number>`: the maximum number found by the query

> **Usage**

Given this data in the `people` model:

|  name  |  age  |
|:------:|:-----:|
|  Bob   |  18   |
|  Dale  |  25   |
|  Harry |  32   |

```js
people.max('age')
// -> 32
```

# Information

> miscellaneous info that should be helpful while using Trilogy

## terminology

Trilogy is a layer over a SQLite backend with the kind of API you
normally find used with document stores. So there a few sort of
interchangeable terms involved.

'Table' will generally refer to the actual persisted SQLite
representation of the data, just as 'row' and 'column' usually refer
to the stored records and their values within those tables.

On the other hand, 'model' will generally be used when referring to
the definition provided to and handled by Trilogy. These models represent
a more JavaScript-oriented version of the data, so 'rows' become objects
that have properties representing their 'column'.

## column descriptor

Each property of the object you pass to define the schema of a model is
called a 'column descriptor'. It's so named because it describes the
column - its type, such as `String` or `Number`, and its attributes,
like whether it is the primary key, is nullable, has a default value, etc.

```js
db.model('cars', {
  id: { type: 'increments' },
  make: { type: String, defaultTo: 'Ford' },
  model: { type: String, nullable: false },
  year: Number
})
```

The schema is the object passed as the second argument to `model()`.

```js
{
  id: 'increments',
  make: { type: String, defaultTo: 'Ford' },
  model: { type: String, nullable: false },
  year: Number
}
```

Each key of this object is the name of a column, so in the table
`cars`, there are 4 columns: `id`, `make`, `model`, and `year`.

Let's break down each descriptor.

```js
{
  id: 'increments'
```

The `id` property is defined with `'increments'` as its type. This is a
special type that's really a shortcut for the super long SQL
`integer not null primary key autoincrement`. It declares `id` as a field
that will automatically set itself to the last inserted row's id + 1, and
is the primary key of the table - the one that prevents duplicates.

You can define other types, and other attributes, by providing an object
instead of just the type. This is done with the next descriptor, `make`:

```js
  make: { type: String, defaultTo: 'Ford' },
```

Here, we don't use a string value to declare the type. We use the standard JS
`String` constructor. You can do the same with `Number`, `Boolean`, and `Date`.
This is stored as a `text` column in SQLite.

We also use the `defaultTo` property to set a value that should be used
when `make` isn't provided at creation time.

```js
  model: { type: String, nullable: false },
```

Next up is `model`, also a `String` type, but in this case we set
the `nullable` property to false. This essentially means `model`
is a required property.

```js
  year: Number
}
```

And finally `year` - back to basics on this one. It's defined with the
same shorthand as `id`, only this time it's a `Number`. This is stored
as an `integer` column in SQLite.

### valid column types

| type           | description                                                           |
| -------------- | ----------------------------------------------------------------------|
| `String`       | stored as `text`                                                      |
| `Number`       | stored as `integer`                                                   |
| `Boolean`      | stored as `integer`                                                   |
| `Date`         | stored as `datetime`                                                  |
| `Array`        | inserted as `text` using `JSON.stringify`, returned using `JSON.parse`|
| `Object`       | inserted as `text` using `JSON.stringify`, returned using `JSON.parse`|
| `'json'`       | inserted as `text` using `JSON.stringify`, returned using `JSON.parse`|
| `'increments'` | set as an auto-incrementing `integer` & primary key                   |

Unsupported / unknown types are cast using `String` and stored as `text`.

### valid column attributes

| attribute     | type       | description                                              |
| ------------- | ---------- | -------------------------------------------------------- |
| `primary`     | `Boolean`  | Whether to set this column as the primary key.           |
| `defaultTo`   | `mixed`    | Default value to use when absent.                        |
| `unique`      | `Boolean`  | Whether the column is required to be unique.             |
| `nullable`    | `Boolean`  | Whether to allow null values.                            |
| `notNullable` | `Boolean`  | Works inversely to `nullable`.                           |
| `index`       | `String`   | Specifies the column as an index with the provided name. |
| `get`         | `Function` | Triggered on selects, receives the raw value and should return a new value. |
| `set`         | `Function` | Triggered on inserts, receives the input value and should return a new value. |

## model options

### advanced indexing

When creating a model, the column descriptor can contain an `index` property
to specify that specific column as an index. If you need to define a more
complex index, such as on multiple columns, you can provide an `index` property
in the `options` object instead.

Let's use this as our model's schema for all the following examples:

```js
const schema = {
  brand: String,
  color: String,
  price: Number
}
```

`options.index` accepts a variety of index definitions:

#### single column index

This is equivalent to specifying the index in the column descriptor,
except the index name is automatically generated.

```js
db.create('shoes', schema, { index: 'brand' })
```

#### multiple column index

Create a single index on all the specified columns.

```js
db.create('shoes', schema, { index: ['brand', 'color']})
```

#### multiple indices on multiple columns

Create an index for each set of columns.

```js
db.create('shoes', schema, {
  index: [
    ['brand', 'color'],
    ['color', 'price']
  ]
})
```

#### named indices

All other forms will automatically generate a unique index name of
the format `index_column1[_column2[_column3...]]`. If you want the
index to have a specific custom name, use an object instead.

```js
db.create('shoes', schema, {
  index: {
    idx_brand: 'brand',
    idx_brand_color: ['brand', 'color'],
    idx_color_price: ['color', 'price']
  }
})
```
