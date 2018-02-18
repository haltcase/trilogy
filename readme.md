<p align="center">
  <img src="https://rawgit.com/citycide/trilogy/master/media/logo.svg" width="420" alt="trilogy">
  <br>
  <a href="https://www.npmjs.com/package/trilogy"><img src="https://img.shields.io/npm/v/trilogy.svg?style=flat-square" alt="Version"></a>
  <a href="https://www.npmjs.com/package/trilogy"><img src="https://img.shields.io/npm/l/trilogy.svg?style=flat-square" alt="License"></a>
  <a href="https://travis-ci.org/citycide/trilogy"><img src="https://img.shields.io/travis/citycide/trilogy.svg?style=flat-square" alt="Travis CI"></a>
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square" alt="JavaScript Standard Style"></a>
  <a href="https://gitter.im/citycide/trilogy"><img src="https://img.shields.io/gitter/room/citycide/trilogy.svg?style=flat-square" alt="Gitter"></a>
</p>

> ***trilogy*** is a Promise-based layer over SQLite, featuring type-casting
  schema models and allowing both native & pure JavaScript backends ( and
  in-memory databases ).

- [features](#features)
- [installation](#installation)
- [usage](#usage)
- [contributing](#contributing)
- [license](#license)

---

## features

- Model your tables with native JavaScript

  Set up database tables with types like `String`, `Date`, and `'increments'` -
  and trilogy will handle all the type-casting involved so that you always
  receive what you expect to receive.

- Uses [knex][knex] to build queries

  trilogy uses knex internally to build its queries - but it's also exposed so
  you can use it to build your own ultra-complex queries. No need to mess with
  ridiculous multi-line strings.

- Swappable SQLite backends ( _plus in-memory storage_ )

  trilogy supports both the native [`sqlite3`][sqlite3] module as well as
  [`sql.js`][sqljs] - meaning you can easily embed a SQLite database without a
  compilation step like `gyp`, which can get a little tricky when dealing with
  multiple platforms or architectures.

  You can even swap the backend after you've started, with no changes to the rest
  of your code! :tada:

- trilogy :heart: [Electron][electron] & [NW.js][nwjs]

  If you've run into issues using `sqlite3` in Electron or NW.js, like many
  have before you, you can easily use trilogy with the `sql.js` backend, which
  doesn't need to be compiled at all! Plus, you still get all the greatness of
  a simple API and all the raw power of knex's query building - wrapped
  in a neat little package. :gift:

## installation

1. Install trilogy

   ```console
   npm i trilogy
   ```

2. Install a backend

   ```console
   npm i sqlite3
   ```

   _or_

   ```console
   npm i sql.js
   ```

## usage

See the [documentation here][docs] for the full API - including usage syntax
and examples.

Here's a quick overview. It uses `async` & `await` but is easily usable with
vanilla Promises.

```js
import Trilogy from 'trilogy'

// defaults to using the `sqlite3` backend
const db = new Trilogy('./file.db')

// choose `sql.js` to avoid native compilation :)
const db = new Trilogy('./file.db', {
  client: 'sql.js'
})

// set the filename to ':memory:' for fast, in-memory storage
const db = new Trilogy(':memory:', {
  // it works for both clients above!
  client: 'sql.js'
})

;(async function () {
  const games = await db.model('games', {
    name: { type: String },
    genre: String,                           // type shorthand
    released: Date,
    awards: Array,
    id: 'increments'                         // special type, primary key
  })

  await games.create({
    name: 'Overwatch',
    genre: 'FPS',
    released: new Date('May 23, 2016'),
    awards: [
      'Game of the Year',
      'Best Multiplayer Game',
      'Best ESports Game'
    ]
  })

  const overwatch = await games.findOne({ name: 'Overwatch' })

  console.log(overwatch.awards[1])
  // -> 'Best Multiplayer Game'
})()
```

## contributing

This project is open to contributions of all kinds! Don't worry
if you're not 100% up to speed on the process - there's a short
outline in the [Contributor Guide](.github/contributing.md).

You'll also find a reference for the set of labels used to
categorize issues, with descriptions of each.
([Contributor Guide - issue labels](.github/contributing.md#labels))

Also, please read and follow the project's [Code of Conduct](.github/code_of_conduct.md).

## license

MIT © Bo Lingen / citycide

See [license](license)

[sqlite3]: https://github.com/mapbox/sqlite3
[sqljs]: https://github.com/kripken/sql.js
[knex]: https://github.com/tgriesser/knex
[electron]: https://github.com/electron/electron
[nwjs]: https://github.com/nwjs/nw.js
[docs]: https://citycide.github.io/trilogy/#/api
