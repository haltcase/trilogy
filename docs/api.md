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

// with options:

// use `sql.js` to avoid build issues like gyp
const db = new Trilogy('./storage.db', {
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
them. The same goes for all other supported data types, which include:

If any property of `schema` is not present in knex's methods
it will be ignored. See [knex's documentation](http://knexjs.org/#Schema-Building)
on Schema Building for the available attributes when creating column tables.

> **Arguments**

  - `{string} name`: name of the model
  - `{Object} schema`: describes the schema of the table
  - _optional_ `{Object} options`:

| property       | type            | default | description                                                                                        |
| -------------- | :-------------: | :-----: | ---------------------------------------------------------------------------------------------------|
| `compositeKey` | `Array<string>` | -       | Array of column names as strings. A composite primary key will be created on all of these columns. |

> **Returns**

[`Model`](/api#model-codeclasscode)

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

## Properties

### models

An array of all model names defined on the instance.

> **Type**

`Array<string>`

# Model (`Class`)

Model instances are created using [`model()`](/api#model).
All model instance methods are also accessible at the top
level of a trilogy instance, meaning the following calls are
equivalent:

```js
// given this setup:
const db = new Trilogy('./storage.db')
const users = db.model('users', { /* some schema */ })

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

> **Arguments**

  - _optional_ `{Object} object`: the data to insert
  - _optional_ `{Object} options`
    - _currently unused_

> **Returns**

`Promise<Object>`: the created object

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
    - Array syntax is either a key / value pair (equal to) or a length of 3,
      ie. `['age', '<', 65]` (allows other comparisons)
  - _optional_ `{Object} options`:

| property | type                        | default | description                                                                         |
| -------- | :-------------------------: | :-----: | ----------------------------------------------------------------------------------- |
| `random` | `boolean`                   | `false` | Select a single random record.                                                      |
| `order`  | `string`, `[string, string]` | -       | Specify a selection order. See [the knex docs](http://knexjs.org/#Builder-orderBy). |
| `limit`  | `number`                    | -       | Limit the rows returned.                                                            |
| `skip`   | `number`                    | -       | Skip (offset) a number of records.                                                  |

_Note: if `options.random` is provided, `options.order` is ignored._

> **Returns**

`Promise<Array<Object | mixed>>`: array of found objects, or `object[column]` if a column was provided

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
    - Array syntax is either a key / value pair (equal to) or a length of 3,
      ie. `['age', '<', 65]` (allows other comparisons)
  - _optional_ `{Object} options`:

| property | type                        | default | description                                                                         |
| -------- | :-------------------------: | :-----: | ----------------------------------------------------------------------------------- |
| `random` | `boolean`                   | `false` | Select a single random record.                                                      |
| `order`  | `string`, `[string, string]` | -       | Specify a selection order. See [the knex docs](http://knexjs.org/#Builder-orderBy). |
| `skip`   | `number`                    | -       | Skip (offset) a number of records.                                                  |

_Note: if `options.random` is provided, `options.order` is ignored._

> **Returns**

`Promise<Object | mixed>`: the found object, or `object[column]` if a column was provided

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

### update
```js
model.update([criteria], data, [options])
```

Modify the properties of an existing object.

> **Arguments**

  - _optional_ `{Object | Array} criteria`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is either a key / value pair (equal to) or a length of 3,
      ie. `['age', '<', 65]` (allows other comparisons)
  - `{Object} data`: the updates to be made
  - _optional_ `{Object} options`
    - _currently unused_

> **Returns**

`Promise<number>`: the number of rows affected

### updateOrCreate
```js
model.updateOrCreate(criteria, creation, [options])
```

Update an existing object or create it if it doesn't exist.

> **Arguments**

  - `{Object} criteria`: criteria to search for
  - `{Object} creation`: data used to create the object if it doesn't exist
  - _optional_ `{Object} options`:

> **Returns**

`Promise<number>`: the number of rows affected

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
    - Array syntax is either a key / value pair (equal to) or a length of 3,
      ie. `['age', '<', 65]` (allows other comparisons)
  - _optional_ `{mixed} defaultValue`: returned if the result doesn't exist

> **Returns**

`Promise<mixed>`

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
    - Array syntax is either a key / value pair (equal to) or a length of 3,
      ie. `['age', '<', 65]` (allows other comparisons)
  - `{mixed} value`: the new value

> **Returns**

`Promise<number>`: the number of rows affected

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
    - Array syntax is either a key / value pair (equal to) or a length of 3,
      ie. `['age', '<', 65]` (allows other comparisons)

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
    - Array syntax is either a key / value pair (equal to) or a length of 3,
      ie. `['age', '<', 65]` (allows other comparisons)
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
    - Array syntax is either a key / value pair (equal to) or a length of 3,
      ie. `['age', '<', 65]` (allows other comparisons)

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

**Returns** `Promise<number>`: the number of rows affected

### count
```js
model.count([column], [criteria], [options])
```

Count the number of rows, matching `criteria` if specified.

> **Arguments**

  - _optional_ `{string} column`: column to select on
  - _optional_ `{Object | Array} criteria`: criteria used to restrict selection
    - Object syntax means 'where (key) is equal to (value)'
    - Array syntax is either a key / value pair (equal to) or a length of 3,
      ie. `['age', '<', 65]` (allows other comparisons)
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
    - Array syntax is either a key / value pair (equal to) or a length of 3,
      ie. `['age', '<', 65]` (allows other comparisons)
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
    - Array syntax is either a key / value pair (equal to) or a length of 3,
      ie. `['age', '<', 65]` (allows other comparisons)
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

Trilogy is a layer of the kind of APIs you'd normally find used with
document stores over a SQLite backend. So there a few sort of
interchangeable terms involved.

'Table' will generally refer to the actual persisted SQLite
representation of the data, just as 'row' and 'column' usually refer
to the stored records and their values within those tables.

On the other hand, 'model' will generally be used when referring to
the definition provided to and handled by Trilogy. These models represent
a more JavaScript-oriented version of the data, so 'rows' become objects that have properties representing their 'column'.

## column descriptor

Each property of the object you pass to define the schema of a model is called a 'column descriptor'. It's so named because it describes the
column - its type, such as `String` or `Number`, and its attributes,
like whether it is the primary key, is nullable, has a default value,
etc.

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
special type that's really a shortcut for the super long SQL `integer not null primary key autoincrement`. It declares `id` as a field that will
automatically set itself to the last inserted row's id + 1, and is the
primary key of the table - the one that prevents duplicates.

You can define other types, and other attributes, by providing an object
instead of just the type. This is done with the next descriptor, `make`:

```js
  make: { type: String, defaultTo: 'Ford' },
```

Here, we don't use a string value to declare the type. We use the standard JS `String` constructor. You can do the same with `Number`,
`Boolean`, and `Date`. This is stored as a `text` column in SQLite.

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
same shorthand as `id`, only this time it's a `Number`. This is stored as an `integer` column in SQLite.

### valid column types

| type           | description                                                           |
| -------------- | ----------------------------------------------------------------------|
| `'json'`       | inserted as `text` using `JSON.stringify`, returned using `JSON.parse`|
| `'increments'` | set as an autoincrementing `integer` & primary key                    |
| `String`       | stored as `text`                                                      |
| `Number`       | stored as `integer`                                                   |
| `Boolean`      | stored as `integer`                                                   |
| `Date`         | stored as `datetime`                                                  |

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