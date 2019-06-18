# Defining models

Models are the central concept in trilogy &mdash; they're the containers
that all objects are created in and conform to, and they map to SQLite's
tables. You create them with a _schema_ that defines what properties each
object will contain and what type each of those fields are. In SQLite
you would call these objects _rows_ and its properties _columns_, where
a column has a type such as `TEXT` or `INTEGER`. In trilogy, those types
are defined using JavaScript's usual suspects: `String`, `Number`, and
even `Array`, `Object`, and more.

Let's first get trilogy imported and a database created:

```ts
import { connect } from 'trilogy'

const db = connect('./storage.db')
```

Now, let's create a `users` model:

```ts
const userSchema = {
  name: String,
  age: Number,
  birthdate: Date,
  id: 'increments'
}

const users = await db.model('users', userSchema)
```

There is now a `users` model (table) in our SQLite database, with the
properties (columns) `name`, `age`, `birthdate`, and `id`. The first three
are pretty obvious data types, while the third uses a special `'increments'`
type, which is short for the equivalent super verbose SQL
`integer not null primary key autoincrement`.

## Property types

| type           | description                                                          |
| -------------- | -------------------------------------------------------------------- |
| `String`       | stored as `text`                                                     |
| `Number`       | stored as `integer`                                                  |
| `Boolean`      | stored as `integer`                                                  |
| `Date`         | stored as `text` ([ISO formatted string][mdn-iso])                   |
| `Array`        | stored as `text` using `JSON.stringify`, returned using `JSON.parse` |
| `Object`       | stored as `text` using `JSON.stringify`, returned using `JSON.parse` |
| `'json'`       | stored as `text` using `JSON.stringify`, returned using `JSON.parse` |
| `'increments'` | set as an auto-incrementing `integer` & primary key                  |

## Property attributes

There are also various attributes you can apply to a property. In that case
we move away from what is actually a shorthand for the property definition
to its equivalent object definition where we can then add more attributes:

```diff
  const userSchema = {
-   name: String,
+   name: { type: String, primary: true }
    age: Number,
    birthdate: Date,
    id: 'increments'
  }
```

| attribute     | type       | description                                                |
| ------------- | ---------- | ---------------------------------------------------------- |
| `primary`     | `boolean`  | Whether to set this property as the primary key.           |
| `defaultTo`   | `any`      | Default value to use when absent.                          |
| `unique`      | `boolean`  | Whether the property is required to be unique.             |
| `nullable`    | `boolean`  | Whether to allow null values.                              |
| `notNullable` | `boolean`  | Works inversely to `nullable`.                             |
| `index`       | `string`   | Specifies the property as an index with the provided name. |
| `get`         | `Function` | Triggered on selects, receives the raw value and should return a new value. |
| `set`         | `Function` | Triggered on inserts, receives the input value and should return a new value. |

```ts
const myGamesSchema = {
  name: { type: String, primary: true },
  category: { type: String, defaultTo: 'backlog' }
  genre: String,
  owned: Boolean
}
```

## Property descriptors

Now that you've seen types and attributes, the values collectively known
as a property's _descriptor_, let's move on to take a deeper dive into the
property definitions of a schema for a `cars` model.

```ts
db.model('cars', {
  id: 'increments',
  make: { type: String, defaultTo: 'Ford' },
  model: { type: String, nullable: false },
  year: Number
})
```

The schema is the object passed as the second argument to `model()`.
Each key of this object is the name of a property, so in the model
`cars`, there are 4 properties: `id`, `make`, `model`, and `year`.

Let's break down each descriptor, starting with `id`:

```ts{2}
{
  id: 'increments',
  make: { type: String, defaultTo: 'Ford' },
  model: { type: String, nullable: false },
  year: Number
}
```

The `id` property is defined with `'increments'` as its type. As shown
earlier in the types section, this is a special type that's really a shortcut
for the super long SQL `integer not null primary key autoincrement`. It
declares `id` as a field that will automatically set itself to the last
inserted row's id + 1, and is the primary key of the table &mdash; the one
that prevents duplicates.

Remember that you can define other types and attributes by providing an object
instead of just the type. This is done with the next descriptor, `make`:

```ts{3}
{
  id: 'increments',
  make: { type: String, defaultTo: 'Ford' },
  model: { type: String, nullable: false },
  year: Number
}
```

Here, we don't use a string value to declare the type. We use the standard
JavaScript `String` constructor. You can do the same with `Number`, `Boolean`,
and `Date` as seen eariler. This stores `make` as a `text` column in SQLite.

We also use the `defaultTo` property to set a value that should be used
when `make` isn't provided at creation time.

Next up is `model` (not to be confused with trilogy's `model`):

```ts{4}
{
  id: 'increments',
  make: { type: String, defaultTo: 'Ford' },
  model: { type: String, nullable: false },
  year: Number
}
```

`model` is also a `String` type, but in this case we set the `nullable`
property to false. This essentially means `model` is a required property.

And finally `year`:

```ts{5}
{
  id: 'increments',
  make: { type: String, defaultTo: 'Ford' },
  model: { type: String, nullable: false },
  year: Number
}
```

Back to basics on this one. It's defined with the same shorthand as `id`,
only this time it's a `Number`. This is stored as an `integer` column in
SQLite.

[mdn-iso]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
