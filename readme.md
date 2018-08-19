<p align="center">
  <img src="https://rawgit.com/citycide/trilogy/master/media/logo.svg" width="420" alt="trilogy">
  <br>
  <a href="https://www.npmjs.com/package/trilogy"><img src="https://img.shields.io/npm/v/trilogy.svg?style=flat-square" alt="Version"></a>
  <a href="https://www.npmjs.com/package/trilogy"><img src="https://img.shields.io/npm/l/trilogy.svg?style=flat-square" alt="License"></a>
  <a href="https://travis-ci.org/citycide/trilogy"><img src="https://img.shields.io/travis/citycide/trilogy.svg?style=flat-square" alt="Travis CI"></a>
  <a href="http://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html"><img src ="https://img.shields.io/badge/written%20in-TypeScript-294E80.svg?style=flat-square" alt="Written in TypeScript"></a>
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square" alt="JavaScript Standard Style"></a>
  <a href="https://gitter.im/citycide/trilogy"><img src="https://img.shields.io/gitter/room/citycide/trilogy.svg?style=flat-square" alt="Gitter"></a>
</p>

***trilogy*** is a simple and extensible Promise-based wrapper for SQLite databases.

It's not an ORM and isn't intended to be one &mdash; it doesn't have any relationship features and instead focuses on providing a simple, clear API for query building.

---

[features](#features) &middot; [installation](#installation) &middot; [usage](#usage) &middot; [contributing](#contributing) &middot; [license](#license)

---

## features

* :link: **automatically casts data between JavaScript & SQLite types**

  Define schemas with types like `String`, `Date`, or `'increments'` &mdash;
  trilogy will handle all the type-casting involved to map accurately
  between JavaScript and the underlying SQLite database.

* :battery: **powered by the [knex][knex] query builder**

  trilogy uses knex internally to build its queries, but it's also exposed so
  you can use it to build your own. No need to mess with ridiculous multi-line
  strings.

* :electric_plug: **supports multiple swappable backends ( _plus in-memory storage_ )**

  Both the native [`sqlite3`][sqlite3] module _and_ [`sql.js`][sqljs] (pure
  JavaScript!) are supported. There is also memory-only storage for fast,
  unpersisted data handling, which is great for tests and performance critical
  situations.

  You can even swap the backend after you've started, with no changes to the
  rest of your code! :tada:

* :cop: **written in [TypeScript][typescript]**

  trilogy is written in and provides a first-class experience for TypeScript.

* :cake: **extensible with plugins**

  Out of the box, trilogy focuses on providing a simple, lightweight querying
  API, but it's also open to a system of plugins that can add functionality.

* :revolving_hearts: **perfect for [Electron][electron] & [NW.js][nwjs]**

  Compiling the `sqlite3` module for all the platforms you target with Electron
  or NW.js isn't always easy, so you can easily use trilogy with the `sql.js`
  backend, which doesn't need to be compiled at all!

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

See the [documentation here][docs] for the full API &mdash; including usage and
examples.

Here's a quick overview. It uses `async` & `await` but is easily usable with
vanilla Promises.

```js
import { connect } from 'trilogy'

// defaults to using the `sqlite3` backend
const db = connect('./file.db')

// choose `sql.js` to avoid native compilation :)
const db = connect('./file.db', {
  client: 'sql.js'
})

// set the filename to ':memory:' for fast, in-memory storage
const db = connect(':memory:', {
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

This project is open to contributions of all kinds! Don't worry if you're
not 100% up to speed on the process &mdash; there's a short outline in the
[Contributor Guide](.github/contributing.md).

You'll also find a reference for the set of labels used to categorize issues,
with descriptions of each.
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
[typescript]: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html
