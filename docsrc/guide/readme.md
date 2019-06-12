# Introduction

***trilogy*** is a simple Promise-based wrapper for SQLite databases.
It supports both the native C++ [`sqlite3`][sqlite3] driver and the pure
JavaScript [`sql.js`][sqljs] backend &mdash; compile natively for speed
when you need it, or use `sql.js` headache-free in cross-platform environments
and [Electron][electron] apps.

It's not an ORM and isn't intended to be one &mdash; it doesn't have any
relationship features. Instead it focuses on providing a simple, clear API
that's influenced more by [Mongoose][mongoose] than by SQL.

With trilogy, rather than using the SQL language or even much of a
_query builder_, your queries look like this:

```js
;(async () => {
  const users = await db.model('users', {
    id: 'increments',
    name: String,
    comments: Number,
    admin: Boolean
  })

  await users.create({
    name: 'anon',
    comments: 0,
    admin: false
  })

  await users.create({
    name: 'boss',
    comments: 0,
    admin: true
  })

  console.log(await users.findOne({ name: 'anon' }))
  // -> { id: 1, name: 'anon', comments: 0, admin: false }

  console.log(await users.findOne({ name: 'boss' }))
  // -> { id: 2, name: 'boss', comments: 0, admin: true }

  console.log(await users.count({ admin: true }))
  // -> 1
})()
```

However, there will always be cases where more complex queries are needed.
trilogy exposes its internal query builder ([knex][knex]) for those
scenarios, which means you don't hit any limits.

Ready to check it out? Read on for installation and setup, or you can
jump straight to the [full API documentation](../reference/api.md).

[sqlite3]: https://github.com/mapbox/sqlite3
[sqljs]: https://github.com/kripken/sql.js
[electron]: https://electronjs.org/
[mongoose]: https://mongoosejs.com/
[knex]: https://github.com/tgriesser/knex
