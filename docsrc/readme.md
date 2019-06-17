---
home: true
heroImage: https://raw.githubusercontent.com/citycide/trilogy/master/media/logo.svg?sanitize=true
heroText: ' '
tagline: this time the SQL really is better than the original
actionText: Get Started →
actionLink: /guide/
footer: MIT Licensed | Copyright © 2016-present Bo Lingen
---

<br/><br/>

<p align="center">
  <a href="https://www.npmjs.com/package/trilogy"><img src="https://flat.badgen.net/npm/v/trilogy" alt="Version"></a>
  <a href="https://www.npmjs.com/package/trilogy"><img src="https://flat.badgen.net/npm/license/trilogy" alt="License"></a>
  <a href="https://travis-ci.org/citycide/trilogy"><img src="https://flat.badgen.net/travis/citycide/trilogy" alt="Travis CI"></a>
  <a href="http://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html"><img src ="https://flat.badgen.net/badge/written%20in/TypeScript/294E80" alt="Written in TypeScript"></a>
  <a href="https://standardjs.com"><img src="https://flat.badgen.net/badge/code%20style/standard/green" alt="JavaScript Standard Style"></a>
  <a href="https://gitter.im/citycide/trilogy"><img src="https://flat.badgen.net/badge/chat/on%20gitter/green" alt="Gitter"></a>
</p>

<br/><br/>

***trilogy*** is a simple Promise-based wrapper for SQLite databases.
It supports both the native C++ [`sqlite3`][sqlite3] driver and the pure
JavaScript [`sql.js`][sqljs] backend &mdash; compile natively for speed
when you need it, or use `sql.js` headache-free in cross-platform environments
and [Electron][electron] apps.

It's not an ORM and isn't intended to be one &mdash; it doesn't have any
relationship features. Instead it focuses on providing a simple, clear API
that's influenced more by [Mongoose][mongoose] than by SQL.

---

<p align="center">
  <a href="#features">features</a>
  &sdot;
  <a href="#quick-start">quick start</a>
</p>

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

* :nut_and_bolt: **supports multiple swappable backends ( _plus in-memory storage_ )**

  Both the native [`sqlite3`][sqlite3] module _and_ [`sql.js`][sqljs] (pure
  JavaScript!) are supported. There is also memory-only storage for fast,
  unpersisted data handling, which is great for tests and performance critical
  situations.

  You can even swap the backend after you've started, with no changes to the
  rest of your code!

  [***learn more***](reference/backends.md)

* :cop: **written in [TypeScript][typescript]**

  trilogy is written in and provides a first-class experience for TypeScript.

* :electric_plug: **lifecycle hooks**

  Any number of hooks (aka subscribers or listeners) can be attached at several
  points in the lifecycle &mdash; for example `onQuery`, `beforeCreate`, `afterUpdate`.
  These are useful for debugging and extensibility.

* :revolving_hearts: **perfect for [Electron][electron] & [NW.js][nwjs]**

  Compiling the `sqlite3` module for all the platforms you target with Electron
  or NW.js can be difficult. That's why trilogy also supports the `sql.js` backend,
  which doesn't need to be compiled at all!

## quick start

```sh
yarn add trilogy sqlite3 # or sql.js
```

```js
import { connect } from 'trilogy'

const db = connect(':memory:')

;(async function () {
  const games = await db.model('games', {
    name: { type: String },
    genre: String,            // type shorthand
    released: Date,
    awards: Array,
    id: 'increments'          // special type, primary key
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

Looking for a more [thorough guide](guide/)?

[sqlite3]: https://github.com/mapbox/sqlite3
[sqljs]: https://github.com/kripken/sql.js
[mongoose]: https://mongoosejs.com/
[knex]: https://github.com/tgriesser/knex
[electron]: https://github.com/electron/electron
[nwjs]: https://github.com/nwjs/nw.js
[typescript]: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html
