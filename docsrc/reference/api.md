---
title: API
sidebar: auto
---

## connect
```ts
connect (path: string, options?: TrilogyOptions): Trilogy
```

Initialize a new datastore instance, creating a SQLite database file at
the provided `path` if it does not yet exist, or reading it if it does.

trilogy can use both the native `sqlite3` module or `sql.js` &mdash; the
latter does not require compiling, whereas the former must be built against
its runtime environment. The goal is that the difference should be totally
invisible to you, so usage from trilogy's standpoint stays the same no
matter which one you choose. You should also be able to change it at any
time without any hitches.

If `path` is exactly `':memory:'`, no file will be created and an in-memory
store will be used. This doesn't persist any of the data.

See [_"Backends"_](backends.md) for more about the backend options trilogy
supports and some guidance on which to choose.

::: arguments
* `{string} path`:
  absolute or relative file path. If relative it is resolved against
  `process.cwd()`, or the `options.dir` property if it is provided.
* _optional_ `{TrilogyOptions} options`:

| property  | type       | default         | description                                         |
| --------- | :-------:  | :-------------: | --------------------------------------------------- |
| `client`  | `string`   | `sqlite3`       | Must be one of `sqlite3` or `sql.js`.               |
| `dir`     | `string`   | `process.cwd()` | The working directory with which to resolve `path`. |
| `verbose` | `Function` | `() => {}`      | Receives every query run against the database.      |
:::

::: returns
[`Trilogy`](#trilogy-class)
:::

::: usage
```ts
import { connect } from 'trilogy'

// defaults to using `sqlite3`
const db = connect('./storage.db')
```

With an options object:

```ts
const db = connect('./storage.db', {
  // use `sql.js` to avoid build issues with gyp
  client: 'sql.js',

  // directory with which to resolve `path`
  // it defaults to `process.cwd()`
  dir: path.resolve('./here'),

  // pass a function that receives all queries run
  verbose: console.log.bind(console)
})
```
:::

::: throws
if `path` is not provided
:::

## Trilogy (`Class`)

### model
```ts
model <D> (name: string, schema: SchemaRaw, options?: ModelOptions):
  Promise<Model>
```

::: tip
If you're using TypeScript, you should provide your own type as the
generic `D`, which will allow for much more powerful typechecking! If
you're using JavaScript you can safely ignore the additional `<D>`
syntax and think of `D` as being any old `object`.
:::

Define a new model with the provided `schema`, or return the existing model
if one is already defined with `name`.

Each property of `schema` describes a column, where its key is the name of
the column and its value describes its attributes. The value can be either
a type, such as `String`, `Number`, or `'increments'`, or a more descriptive
object. See [_"Property descriptors"_](../guide/defining-models.md#property-descriptors)
for more information.

This schema controls the handling of values inserted into and retreived from
the database, casting them as needed. For example, SQLite does not support a
boolean data type and instead stores them as integers. trilogy will
transparently cast booleans to integers when inserting them and back to
booleans when retreiving them. The same goes for all other
[supported data types](../guide/defining-models.md#property-types). Unknown
column types will cause an error to be thrown.

If any property of `schema` is not present in knex's methods it will be
ignored. See [knex's documentation](http://knexjs.org/#Schema-Building)
on Schema Building for the available attributes when defining properties.

::: arguments
* `{string} name`: name of the model
* `{SchemaRaw} schema`: describes the schema of the table
* _optional_ `{ModelOptions} options`:

|  property    | type            | default | description                      |
| ------------ | :-------------: | :-----: | -------------------------------- |
| `timestamps` | `boolean`       | -       | When `true`, adds `created_at` and `updated_at` properties, both defaulting to the current timestamp. |
| `primary`    | `string[]`      | -       | An array of column names to specify as a composite primary key. |
| `unique`     | `string[]`      | -       | An array of column names on which to apply unique constraints. |
| `index`      | `string`, `string[]`, `Array<string[]>`, `object` | - | See [_"Complex indexing"_](../guide/defining-models.md#complex-indexing) |
:::

::: warning
Specifying a column as either `primary` or `unique` in both the column
descriptor and the `options.primary` or `options.unique` arrays will result
in an error, as the constraint will have already been applied.
:::

::: returns
`Promise<`[`Model`](#model-class)`<D>>`
:::

::: usage
```ts
await db.model('people', {
  name: String,
  age: Number,
  email: String,
  uid: { type: Number, primary: true }
})

await db.find('people', { /* ... */ })
await db.create('people', { /* ... */ })
await db.min('people.age', { /* ... */ })

// already defined, so it's returned
const people = await db.model('people')

// since `model()` returns a model instance,
// you can use methods on that instance like so:
await people.find({ /* ... */ })
await people.create({ /* ... */ })
await people.min('age', { /* ... */ })
```
:::

### getModel
```ts
getModel <D> (name: string): Model
```

Provides a way to synchronously retrieve a model. If that model doesn't
exist an error will be thrown, so you should only use this if you're sure
it has been defined. Or you can check first with [`hasModel`](#hasmodel)
or use [`model`](#model), which returns existing definitions.

::: arguments
* `{string} name`: name of the model
:::

::: returns
[`Model`](#model-class)
:::

::: usage
```ts
db.getModel('people')
// Error: no model defined by the name 'people'

const people = await db.model('people', {
  name: String
})

const alsoPeople = db.getModel('people')
alsoPeople.find(/*...*/)

// these reference the exact same object (the `Model`)
people === alsoPeople
// -> true
```
:::

::: throws
if no model by the name of `name` has been created
:::

### hasModel
```ts
hasModel (name: string): Promise<boolean>
```

First checks if the model's been defined with trilogy, then runs an existence
query on the database, returning `true` if the table exists or `false` if it
doesn't.

::: arguments
* `{string} name`: the name of the model to check
:::

::: returns
`Promise<boolean>`
:::

::: usage
```ts
const exists = await db.hasModel('people')
if (exists) {
  console.log('it exists!')
}
```
:::

### dropModel
```ts
dropModel (name: string): Promise<boolean>
```

Removes the specified model from trilogy's definition and the database.

::: arguments
* `{string} name`: the name of the model to remove
:::

::: returns
 `Promise<boolean>`: `true` if successful or `false` if the model was not
 defined with trilogy
:::

::: usage
```ts
await db.dropModel('people')
// model & table dropped
```
:::

### raw
```ts
raw (query: knex.QueryBuilder | knex.Raw, needResponse?: boolean): Promise<any>
```

Allows running any arbitrary query generated by trilogy's [`.knex`](#knex)
instance. If the result is needed, pass `true` as the second argument, otherwise
the number of affected rows will be returned ( if applicable ).

::: arguments
* `{knex.QueryBuilder | knex.Raw} query`: any knex query created with [`.knex`](#knex)
* `{boolean} needResponse`: whether to return the result of the query
:::

::: returns
`Promise<any>`
:::

::: usage
```ts
const query = db.knex('users')
  .innerJoin('accounts', function () {
    this.on('accounts.id', '=', 'users.account_id')
      .orOn('accounts.owner_id', '=', 'users.id')
  })

db.raw(query, true).then(result => {})
```
:::

### close
```ts
close (): Promise<void>
```

Drains the connection pools and releases connections to any open database
files. This should always be called at the end of your program to gracefully
shut down, and only once since the connection can't be reopened.

::: arguments
None
:::

::: returns
`Promise<void>`
:::

::: usage
```ts
import { connect } from 'trilogy'

const db = connect('./file.db')

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
:::

### models
```ts
models: string[]
```

An array of all model names defined on the instance.

### knex

Exposes trilogy's knex instance to allow more complex query building.
You can use this to create queries that aren't necessarily feasible
with trilogy's API, like nested where clauses that require functions
as arguments.

::: danger
It is highly recommended that you do _not_ call `then` or otherwise execute
the query. Pass the knex query object as-is to [`raw()`](#raw) for execution.
This ensures maximum compatibility between backends.

All of the following methods will cause execution when chained to a
knex query, so avoid using these when building raw queries you intend
to run with trilogy:

  * Promises: `then`, `catch`, `tap`, `map`, `reduce`, `bind`, `return`
  * Callbacks: `asCallback`
  * Streams: `stream`, `pipe`
:::

The following methods shouldn't cause problems, but they aren't
guaranteed to work, especially when using `sql.js`:

  * Events: `on` [`'query'`, `'query-error'`, `'query-response'`]

And finally the following methods will work just fine, but you should
not chain them on a query object before passing it to trilogy. Running
them separately is fine:

  * Other: `toString`, `toSQL`

For more advanced usage, see [knex's own documentation](http://knexjs.org/).

::: usage
```ts
import { connect } from 'trilogy'

const db = connect('./file.db')

const query = db.knex('users').select('*')
console.log(query.toString())
// -> 'select * from `users`'

db.raw(query, true).then(users => {})
```
:::

More complex queries are possible this way:

```ts
const query = db.knex('users')
  .innerJoin('accounts', function () {
    this.on('accounts.id', '=', 'users.account_id')
      .orOn('accounts.owner_id', '=', 'users.id')
  })

db.raw(query, true).then(result => {})
```

_Don't_ do the following, as it will cause query execution.

```ts
db.knex('users').select('*')
  .then(() => {})
```

## Model (`Class`)

Model instances are created using [`model()`](#model). Almost every model
instance method is also accessible at the top level of a trilogy instance,
meaning the following calls are equivalent:

```ts
// given this setup:
const db = connect('./storage.db')
const users = await db.model('users', { /* some schema */ })

// these are equivalent:
await db.find('users', { name: 'citycide' })
await users.find({ name: 'citycide' })
```

:::tip EXCEPTIONS

These model instance methods don't exist on database instances:

* [findIn](#findin) &mdash; use `find` with `'table.column'` dot-notation
* [findOneIn](#findonein) &mdash; use `findOne` with `'table.column'` dot-notation
* [countIn](#countin) &mdash; use `count` with `'table.column'` dot-notation

:::

The function signatures remain the same except you provide the model name and,
in some cases, the column name, as the first argument. Column names should be
passed along with the table in dot-notation, ie. `'users.name'`.

If you're using TypeScript, you should provide a type to the model constructor
to make typechecking much more powerful:

```ts
const db = connect(':memory:')

type Game = {
  name: string,
  players: number,
  is_card: boolean,
  is_dice: boolean
}

;(async () => {
  // provide the `Game` type to `model()` here
  const games = await db.model<Game>('games', {
    name: String,
    players: Number,
    is_card: Boolean,
    is_dice: Boolean
  })

  // this could fail at compile time if it didn't satisfy the provided type
  await games.create({
    name: 'Solitaire',
    players: 1,
    is_card: true,
    is_dice: false
  })

  // type is inferred here as `Game[]`
  const allGames = await games.find()

  // you get suggestions and type checking here
  console.log(allGames[0].players)
  // -> 1
})()
```

If you don't provide a type, a loose default is used that prevents strong
type safety.

::: tip
For TypeScript users, `Model` classes can be constructed with a generic type
that determines how their methods are typechecked. That type is represented as
a `D` in this documentation.
:::

### create
```ts
create (object: D, options?: CreateOptions): Promise<D>
```

Insert an object into the table. `object` should match the model's defined
schema, values will cast into types as needed. If a unique or primary
constraint exists on a property the insert will be ignored when violating
this constraint.

::: arguments
* `{D} object`: the data to insert
* _optional_ `{CreateOptions} options`

| property | type      | default | description                               |
| -------- | :-------: | :-----: | ----------------------------------------- |
| `raw`    | `boolean` | `false` | If `true`, will bypass getters & setters. |
:::

::: returns
`Promise<D>`: the created object
:::

::: usage
```ts
players.create({
  id: 197397332,
  username: 'xX420_sniperXx',
  friends: ['xX420_kniferXx']
}).then(object => {
  console.log(object)
  // -> { id: 197397332,
  //      username: 'xX420_sniperXx',
  //      friends: ['xX420_kniferXx'] }
})
```
:::

### find
```ts
find (criteria?: Criteria<D>, options?: FindOptions): Promise<D[]>
```

Find all objects matching `criteria`.

::: arguments
* _optional_ `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
* _optional_ `{FindOptions} options`:

| property | type                        | default | description                                                                         |
| -------- | :-------------------------: | :-----: | ----------------------------------------------------------------------------------- |
| `random` | `boolean`                   | `false` | Select a single random record.                                                      |
| `order`  | `string`, `[string, string]` | -       | Specify a selection order. See [the knex docs](http://knexjs.org/#Builder-orderBy). |
| `limit`  | `number`                    | -       | Limit the rows returned.                                                            |
| `skip`   | `number`                    | -       | Skip (offset) a number of records.                                                  |
| `raw`    | `boolean`                   | `false` | If `true`, will bypass getters & setters.                                           |

_Note: if `options.random` is provided, `options.order` is ignored._
:::

::: returns
`Promise<D[]>`: array of found objects
:::

::: usage
```ts
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

const found = await todos.find('name', ['priority', '<', 3])
console.log(found.map(todo => todo.name))
// -> ['code', 'docs']
```
:::

### findIn
```ts
findIn (
  column: string, criteria?: Criteria<D>, options?: FindOptions
): Promise<(D[keyof D])[]>
```

Find all objects matching `criteria` and extract the given column from each one.

::: arguments
* `{string} column`: the column to select from matching objects
* _optional_ `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
* _optional_ `{FindOptions} options`:

| property | type                        | default | description                                                                         |
| -------- | :-------------------------: | :-----: | ----------------------------------------------------------------------------------- |
| `random` | `boolean`                   | `false` | Select a single random record.                                                      |
| `order`  | `string`, `[string, string]` | -       | Specify a selection order. See [the knex docs](http://knexjs.org/#Builder-orderBy). |
| `limit`  | `number`                    | -       | Limit the rows returned.                                                            |
| `skip`   | `number`                    | -       | Skip (offset) a number of records.                                                  |
| `raw`    | `boolean`                   | `false` | If `true`, will bypass getters & setters.                                           |

_Note: if `options.random` is provided, `options.order` is ignored._
:::

::: returns
`Promise<(D[keyof D])[]>`: value at `column` from each matching object
:::

::: usage
```ts
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

const found = await todos.findIn('name', ['priority', '<', 3])
console.log(found)
// -> ['code', 'docs']
```
:::

### findOne
```ts
findOne (criteria?: Criteria<D>, options?: FindOptions): Promise<D>
```

Find a single object.

::: arguments
* _optional_ `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
* _optional_ `{FindOptions} options`:

| property | type                        | default | description                                                                         |
| -------- | :-------------------------: | :-----: | ----------------------------------------------------------------------------------- |
| `random` | `boolean`                   | `false` | Select a single random record.                                                      |
| `order`  | `string`, `[string, string]` | -       | Specify a selection order. See [the knex docs](http://knexjs.org/#Builder-orderBy). |
| `skip`   | `number`                    | -       | Skip (offset) a number of records.                                                  |
| `raw`    | `boolean`                   | `false` | If `true`, will bypass getters & setters.                                           |

_Note: if `options.random` is provided, `options.order` is ignored._
:::

::: returns
`Promise<D>`: the found object
:::

::: usage
```ts
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

const found = await todos.findOne({ name: 'docs' })
console.log(found.body)
// -> 'crap what did I create'
```
:::

### findOneIn
```ts
findOneIn (
  column: string, criteria?: Criteria<D>, options?: FindOptions
): Promise<D[keyof D]>
```

Find a single object.

::: arguments
* `{string} column`: the column to select from the matching object
* _optional_ `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
* _optional_ `{FindOptions} options`:

| property | type                        | default | description                                                                         |
| -------- | :-------------------------: | :-----: | ----------------------------------------------------------------------------------- |
| `random` | `boolean`                   | `false` | Select a single random record.                                                      |
| `order`  | `string`, `[string, string]` | -       | Specify a selection order. See [the knex docs](http://knexjs.org/#Builder-orderBy). |
| `skip`   | `number`                    | -       | Skip (offset) a number of records.                                                  |
| `raw`    | `boolean`                   | `false` | If `true`, will bypass getters & setters.                                           |

_Note: if `options.random` is provided, `options.order` is ignored._
:::

::: returns
`Promise<D[keyof D]>`: value at `column` of the found object
:::

::: usage
```ts
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

const found = await todos.findOneIn('name', { priority: 1 })
console.log(found)
// -> { name: 'code',
//      body: 'create the best thing',
//      priority: 1 }
```
:::

### findOrCreate
```ts
findOrCreate (
  criteria: Criteria<D>, creation: Partial<D>, options?: FindOptions
): Promise<D>
```

Find a matching object based on `criteria`, or create it if it doesn't exist.
When creating the object, a merged object created from `criteria` and `creation`
will be used, with the properties from `creation` taking precedence.

::: arguments
* `{Criteria<D>} criteria`: criteria to search for
* `{Partial<D>} creation`: data used to create the object if it doesn't exist
* _optional_ `{FindOptions} options`: same as [`findOne()`](#findOne)
:::

::: returns
`Promise<D>`: the found object, after creation if necessary
:::

::: usage
```ts
const people = await db.model('people', {
  name: { type: String, primary: true },
  age: Number,
  adult: Boolean
})

const person = await people.findOrCreate(
  { name: 'Joe' },
  { age: 13, adult: false }
)

console.log(person)
// -> { name: 'Joe', age: 13, adult: false }

const person2 = await people.findOrCreate(
  { name: 'Joe' },
  { age: 99, adult: true }
)

// 'Joe' already exists and is returned
console.log(person2)
// -> { name: 'Joe', age: 13, adult: false }
```
:::

### update
```ts
update (
  criteria?: Criteria<D>, data?: Partial<D>, options?: UpdateOptions
): Promise<number>
```

Modify the properties of an existing object. While optional, if `data` contains
no properties no update queries will be run.

::: arguments
* _optional_ `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
* _optional_ `{Partial<D>} data`: the updates to be made
* _optional_ `{UpdateOptions} options`

| property | type      | default | description                               |
| -------- | :-------: | :-----: | ----------------------------------------- |
| `raw`    | `boolean` | `false` | If `true`, will bypass getters & setters. |
:::

::: returns
`Promise<number>`: the number of rows affected
:::

::: usage
```ts
const games = await db.model('games', {
  name: { type: String, primary: true },
  genre: String,
  owned: Boolean
})

await games.create({ name: 'Overwatch', genre: 'FPS', owned: false })

const rowsAffected = await games.update(
  { name: 'Overwatch' },
  { owned: true }
)

console.log(rowsAffected)
// -> 1
```
:::

### updateOrCreate
```ts
updateOrCreate (
  criteria: CriteriaObj<D>,
  data: Partial<D>,
  options?: UpdateOptions & CreateOptions
): Promise<number>
```

Update an existing object or create it if it doesn't exist. If creation
is necessary a merged object created from `criteria` and `data` will be
used, with the properties from `data` taking precedence.

::: arguments
* `{CriteriaObj<D>} criteria`: criteria to search for
* `{Partial<D>} data`: updates to be made, or used for object creation
* _optional_ `{UpdateOptions & CreateOptions} options`: same as [`update()`](#update)
:::

::: returns
`Promise<number>`: the number of rows affected
:::

::: usage
```ts
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
:::

### get
```ts
get (
  column: string, criteria?: Criteria<D>, defaultValue?: D[keyof D]
): Promise<D[keyof D]>
```

Works similarly to the `get` methods in lodash, underscore, etc. Returns
the value at `column` or, if it does not exist, the supplied `defaultValue`.

::: arguments
* `{string} column`: the property to retrieve
* _optional_ `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
* _optional_ `{D[keyof D]} defaultValue`: returned if the result doesn't exist
:::

::: returns
`Promise<D[keyof D]>`
:::

::: usage
```ts
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
:::

### set
```ts
set (
  column: string, criteria: Criteria<D>, value: D[keyof D]
): Promise<number>
```

Works similarly to the `set` methods in lodash, underscore, etc. Updates
the value at `column` to be `value` where `criteria` is met.

::: arguments
* `{string} column`: the column to update
* `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
* `{D[keyof D]} value`: the new value
:::

::: returns
`Promise<number>`: the number of rows affected
:::

::: usage
```ts
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
:::

### getRaw
```ts
getRaw (
  column: string, criteria?: Criteria<D>, defaultValue?: D[keyof D]
): Promise<D[keyof D]>
```

Works exactly like [`get()`](#get) but bypasses getters and retrieves
the raw database value.

::: arguments
* `{string} column`: the property to retrieve
* _optional_ `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
* _optional_ `{D[keyof D]} defaultValue`: returned if the result doesn't exist
:::

::: returns
`Promise<D[keyof D]>`
:::

::: usage
```ts
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
:::

### setRaw
```ts
setRaw (
  column: string, criteria: Criteria<D>, value: D[keyof D]
): Promise<number>
```

Works exactly like [`set()`](#set) but bypasses setters when
updating the target value.

::: arguments
* `{string} column`: the column to update
* `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
* `{D[keyof D]} value`: the new value
:::

::: returns
`Promise<number>`: the number of rows affected
:::

::: usage
```ts
const todos = await db.model('todos', {
  name: String,
  body: {
    type: String,
    set: body => { throw new Error(`Sorry, updating 'priority' isn't allowed`) }
  },
  priority: {
    type: Number,
    set: priority => { throw new Error(`Sorry, updating 'body' isn't allowed`) }
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
// -> Error: `Sorry, updating 'priority' isn't allowed`

await todos.set('body', ['priority', '>', 1], 'not important ;)')
// -> Error: `Sorry, updating 'body' isn't allowed`
```
:::

### increment
```ts
increment (
  column: string, criteria?: Criteria<D>, amount: number = 1
): Promise<number>
```

Increment a value at `column` by a specified `amount`, which defaults
to `1` if not provided.

::: arguments
* `{string} column`: the target value
* _optional_ `{number} amount`
  * _default_ = `1`
* _optional_ `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
:::

::: returns
`Promise<number>`: the number of rows affected
:::

::: usage
```ts
// the amount defaults to 1, so these are equivalent
people.increment('age', { name: 'Bob' }, 1)
people.increment('age', { name: 'Bob' })

// happy birthday, Bob!
```
:::

### decrement
```ts
decrement (
  column: string,
  criteria: Criteria<D>,
  amount: number = 1,
  allowNegative: boolean = false
): Promise<number>
```

Decrement a value at `column` by a specified `amount`, which defaults to `1`
if not provided. To allow the target value to dip below `0`, pass `true` as
the final argument.

::: arguments
* `{string} column`: the target value
* _optional_ `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
* _optional_ `{number} amount`
  * _default_ = `1`
* _optional_ `{boolean} allowNegative`: unless set to `true`, the value will not be allowed to go below a value of `0`
  * _default_ = `false`
:::

::: returns
`Promise<number>`: the number of rows affected
:::

::: usage
```ts
// the amount defaults to 1, so these are equivalent
people.decrement('age', { name: 'Benjamin Button' }, 1)
people.decrement('age', { name: 'Benjamin Button' })

// to allow negative values as a result of this query:
people.decrement('age', { name: 'Benjamin Button' }, 1, true)
people.decrement('age', { name: 'Benjamin Button' }, true)
```
:::

### remove
```ts
remove (criteria: Criteria<D>): Promise<number>
```

Delete a row from the table matching `criteria`. If `criteria` is empty or
absent, nothing will be done. This is a safeguard against unintentionally
deleting everything in the table. Use [`clear()`](#clear) if you want
to remove all rows.

::: arguments
* `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
:::

::: returns
`Promise<number>`: the number of rows affected
:::

::: usage
```ts
users.remove({ expired: true })
```
:::

### clear
```ts
clear (): Promise<number>
```

Removes all rows from the table.

::: returns
`Promise<number>`: the number of rows affected
:::

### count
```ts
count (criteria?: Criteria<D>, options?: AggregateOptions): Promise<number>
```

Count the number of rows in the table.

::: arguments
* _optional_ `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
* _optional_ `{AggregateOptions} options`:

|  property   | type       | default | description                      |
| ----------- | :--------: | :-----: | -------------------------------- |
|  `distinct` | `boolean`  | `false` | Counts only unique values if `true`. |
|  `group`    | `string`, `string[]` | - | Add a group clause to the query. |
:::

::: returns
`Promise<number>`: the number of rows found, matching `criteria` if specified
:::

::: usage
Assuming we have this data in our `people` table:

|  name  |  age  |
|:------:|:-----:|
|  Bob   |  18   |
|  Dale  |  25   |
|  Harry |  32   |

```ts
people.count()
// -> 3

people.count(['age', '>', 21])
// -> 2

people.count({ age: 18 })
// -> 1
```

Now assume we've defined models `people`, `places`, `things`, & `ideas`.
If we use `count()` with no arguments on the trilogy instance we can count
the number of tables in the database:

```ts
db.count()
// -> 4
```
:::

### countIn
```ts
countIn (
  column: string, criteria?: Criteria<D>, options?: AggregateOptions
): Promise<number>
```

Count the number of rows in the table, selecting on `column` (meaning `NULL`
values are not counted).

::: arguments
* `{string} column`: column to select on
* _optional_ `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
* _optional_ `{AggregateOptions} options`: same as [`count()`](#count)
:::

::: returns
`Promise<number>`: the number of rows found, matching `criteria` if specified
:::

::: usage
Assuming we have this data in our `people` table:

|  name  |  age  |
|:------:|:-----:|
|  Bob   |  18   |
|  Dale  |  25   |
|  Harry |  32   |

```ts
people.countIn('age')
// -> 3
```
:::

### min
```ts
min (
  column: string, criteria?: Criteria<D>, options?: AggregateOptions
): Promise<number>
```

Find the minimum value contained in the model, comparing all values
in `column` that match `criteria`.

::: arguments
* `{string} column`: column to compare
* _optional_ `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
* _optional_ `{AggregateOptions} options`:

| property | type     | default | description                      |
| -------- | :------: | :-----: | -------------------------------- |
| `group`  | `string`, `string[]` | - | Add a group clause to the query. |
:::

::: returns
`Promise<number>`: the minimum number found by the query
:::

::: usage
Given this data in the `people` model:

|  name  |  age  |
|:------:|:-----:|
|  Bob   |  18   |
|  Dale  |  25   |
|  Harry |  32   |

```ts
people.min('age')
// -> 18
```
:::

### max
```ts
max (
  column: string, criteria?: Criteria<D>, options?: AggregateOptions
): Promise<number>
```

Find the maximum value contained in the model, comparing all values
in `column` that match `criteria`.

::: arguments
* `{string} column`: column to compare
* _optional_ `{Criteria<D>} criteria`: criteria used to restrict selection
  * Object syntax means 'where (key) is equal to (value)'
  * Array syntax is one of:
    * a length of 2, ie. a key / value pair (equal to)
    * a length of 3, ie. `['age', '<', 65]` (allows other comparisons)
    * a list containing any number of the above forms
* _optional_ `{AggregateOptions} options`:

| property | type     | default | description                      |
| -------- | :------: | :-----: | -------------------------------- |
| `group`  | `string`, `string[]` | - | Add a group clause to the query. |
:::

::: returns
`Promise<number>`: the maximum number found by the query
:::

::: usage
Given this data in the `people` model:

|  name  |  age  |
|:------:|:-----:|
|  Bob   |  18   |
|  Dale  |  25   |
|  Harry |  32   |

```ts
people.max('age')
// -> 32
```
:::

## onQuery Hook
```ts
onQuery (fn: OnQueryCallback, options: OnQueryOptions = {}): () => boolean
```

The `onQuery` hook is called each time a query is run on the database, and
receives the query in string form. This is useful for logging and debugging
features.

By default, subscribers to this hook do not receive any of the various internal
queries that trilogy executes behind the scenes. If you want these queries
to be passed as well, set the `includeInternal` property to `true` in the
options parameter of `onQuery`:

```ts
people.onQuery(query => {
  // query is now potentially one of the internal queries
  // trilogy runs behind the scenes for managing models
}, { includeInternal: true })
```

::: arguments
* `{OnQueryCallback} fn`: the function to call when queries are executed
* _optional_ `{OnQueryOptions} options`:

| property | type     | default | description                      |
| -------- | :------: | :-----: | -------------------------------- |
| `includeInternal`  | `boolean` | false | Include internal trilogy queries. |
:::

::: returns
`() => boolean`: unsubscribe function that removes this callback
:::

::: usage
```ts
const unsub = people.onQuery(query => console.log(query))

/* ...queries logged in the meantime... */

unsub()
// no more queries will be logged
```
:::

## beforeCreate Hook
```ts
beforeCreate(fn: BeforeCreateCallback): () => boolean
```

Before an object is created, the `beforeCreate` hook is called with the
object. This occurs _before_ casting, so if a subscriber to this hook
modifies the incoming object those changes will be subject to casting.
It's also possible to prevent the object from being created entirely
by returning the `EventCancellation` symbol from a subscriber callback.

::: arguments
* `{BeforeCreateCallback} fn`: callback executed when the hook is triggered
:::

::: returns
`() => boolean`: unsubscribe function that removes this callback
:::

::: usage
```ts
const unsub = people.beforeCreate(person => {
  if (doesNotMeetCondition(person)) {
    // prevent this object from being created
    return EventCancellation
  }


  person.creation_date = Date.now()
})

unsub()
```
:::

## afterCreate Hook
```ts
afterCreate(fn: AfterCreateCallback): () => boolean
```

When an object is created, that object is returned to you and the
`afterCreate` hook is called with it.

::: arguments
* `{AfterCreateCallback} fn`: callback executed when the hook is triggered
:::

::: returns
`() => boolean`: unsubscribe function that removes this callback
:::

::: usage
```ts
const unsub = people.afterCreate(person => {
  // log the object that was created
  console.log(person)
})

// stop logging
unsub()
```
:::

## beforeUpdate Hook
```ts
beforeUpdate(fn: BeforeUpdateCallback): () => boolean
```

Prior to an object being updated the `beforeUpdate` hook is called with the
update _delta_, or the incoming changes to be made, as well as the criteria.
Casting occurs after this hook. A subscriber could choose to cancel the update
by returning the `EventCancellation` symbol or alter the selection criteria.

::: arguments
* `{BeforeUpdateCallback} fn`: callback executed when the hook is triggered
:::

::: returns
`() => boolean`: unsubscribe function that removes this callback
:::

::: usage
```ts
const unsub = people.beforeUpdate((changes, criteria) => {
  if (criteria.id == null) {
    // make an ID mandatory to update records
    return EventCancellation
  }

  // add a manual timestamp to updated records
  changes.updated_on = Date.now()
})

unsub()
```
:::

## afterUpdate Hook
```ts
afterUpdate(fn: AfterUpdateCallback): () => boolean
```

Subscribers to the `afterUpdate` hook receive modified objects after they
are updated.

::: arguments
* `{AfterUpdateCallback} fn`: callback executed when the hook is triggered
:::

::: returns
`() => boolean`: unsubscribe function that removes this callback
:::

::: usage
```ts
const unsub = people.afterUpdate((updatedPeople) => {
  updatedPeople.forEach(person => {
    console.log(person.updated_on)
  })
})

unsub()
```
:::

## beforeRemove Hook
```ts
beforeRemove(fn: BeforeRemoveCallback): () => boolean
```

Before object removal, the criteria for selecting those objects is passed to
the `beforeRemove` hook. Casting occurs after this hook. Subscribers can modify
the selection criteria or prevent the removal entirely by returning the
`EventCancellation` symbol.

::: arguments
* `{BeforeRemoveCallback} fn`: callback executed when the hook is triggered
:::

::: returns
`() => boolean`: unsubscribe function that removes this callback
:::

::: usage
```ts
const unsub = people.beforeRemove(criteria => {
  if (criteria.id == null) {
    // make an ID mandatory to remove records
    return EventCancellation
  }

  // object will be removed
})

unsub()
```
:::

## afterRemove Hook
```ts
afterRemove(fn: AfterRemoveCallback): () => boolean
```

A list of any removed objects is passed to the `afterRemove` hook.

::: arguments
* `{AfterRemoveCallback} fn`: callback executed when the hook is triggered
:::

::: returns
`() => boolean`: unsubscribe function that removes this callback
:::

::: usage
```ts
const unsub = users.afterRemove(users => {
  users.forEach(user => {
    console.log(`Removed ${user.name} from the database.`)
  })
})

unsub()
```
:::

