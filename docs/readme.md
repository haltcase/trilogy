<p align="center">
  <img src="https://rawgit.com/citycide/trilogy/master/media/logo.svg" width="420" alt="trilogy">
  <br>
  <a href="https://www.npmjs.com/package/trilogy"><img src="https://img.shields.io/npm/v/trilogy.svg?style=flat-square" alt="Version"></a>
  <a href="https://www.npmjs.com/package/trilogy"><img src="https://img.shields.io/npm/l/trilogy.svg?style=flat-square" alt="License"></a>
  <a href="https://travis-ci.org/citycide/trilogy"><img src="https://img.shields.io/travis/citycide/trilogy.svg?style=flat-square" alt="Travis CI"></a>
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square" alt="JavaScript Standard Style"></a>
</p>

> ***trilogy*** is a Promise-based layer over SQLite, featuring type-casting
  schema models and allowing both native & pure JavaScript backends.

- [features](#features)
- [installation](#installation)
- [usage](#usage)
- [contributing](#contributing)
- [license](#license)

---

## features

- Model your tables with native JavaScript

  Set up database tables with types like `String`, `Date`, and `'increments'` -
  and Trilogy will handle all the type-casting involved so that you always
  receive what you expect to receive.

- Uses [knex][knex] to build queries

  Trilogy uses knex internally to build its queries - but it's also exposed so
  you can use it to build your own ultra-complex queries. No need to mess with
  ridiculous multi-line strings.

- Swappable SQLite backends

  Trilogy supports both the native [`sqlite3`][sqlite3] module as well as
  [`sql.js`][sqljs] - meaning you can easily embed a SQLite database without a
  compilation step like `gyp`, which can get a little tricky when dealing with
  multiple platforms or architectures.

  You can even swap the backend after you've started, with no changes to the rest
  of your code! :tada:

- Trilogy :heart: [Electron][electron] & [NW.js][nwjs]

  If you've run into issues using `sqlite3` in Electron or NW.js, like many
  have before you, you can easily use Trilogy with the `sql.js` backend, which
  doesn't need to be compiled at all! Plus, you still get all the greatness of
  a simple API and all the raw power of knex's query building - neatly wrapped
  in a neat little package. :gift:

## installation

1. Install Trilogy

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

;(async function () {
  let games = await db.model('games', {
    name: { type: String, primary: true },   // primary key
    genre: String,                           // type shorthand
    released: Date,
    awards: Array,
    id: 'increments'                         // special type
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

  let overwatch = await games.findOne({ name: 'Overwatch' })

  console.log(overwatch.awards[1])
  // -> 'Best Multiplayer Game'
})()
```

## contributing

Contributions are welcome! Feel free to open an issue or submit a
pull request. For large changes, please open an issue to discuss
the revisions first.

## license

MIT © Bo Lingen / citycide

See [LICENSE](LICENSE)

[sqlite3]: https://github.com/mapbox/sqlite3
[sqljs]: https://github.com/kripken/sql.js
[knex]: https://github.com/tgriesser/knex
[electron]: https://github.com/electron/electron
[nwjs]: https://github.com/nwjs/nw.js
[docs]: https://citycide.github.io/trilogy/#/api
