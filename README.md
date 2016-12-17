<p align="center">
  <img src="https://rawgit.com/citycide/trilogy/master/media/logo.svg" width="420" alt="trilogy">
  <br>
  <a href="https://www.npmjs.com/package/trilogy"><img src="https://img.shields.io/npm/v/trilogy.svg?style=flat-square" alt="Version"></a>
  <a href="https://www.npmjs.com/package/trilogy"><img src="https://img.shields.io/npm/l/trilogy.svg?style=flat-square" alt="License"></a>
  <a href="https://travis-ci.org/citycide/trilogy"><img src="https://img.shields.io/travis/citycide/trilogy.svg?style=flat-square" alt="Travis CI"></a>
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square" alt="JavaScript Standard Style"></a>
</p>

> ***trilogy*** is SQLite - but 100% pure JavaScript. Its core is built on two modules: [SQL.js][sqljs] for accessing and writing to database files and [knex][knex] for building its queries.

## Why?

- No need for `node-gyp` or `node-pre-gyp`

  You can stop building and rebuilding `sqlite3` for every platform - we already have a JS-only implementation in `SQL.js`. Forget about gyp or pre-gyp compilation issues. This is especially helpful when developing multi-platform applications in [Electron][electron] or [NW.js][nwjs].

- No long, unwieldy SQLite query strings

  `knex` can do the job easier and in a more JS-friendly syntax. We just need to bridge the gaps between JavaScript & SQLite and `knex` and `SQL.js`.

- Simple database embedding

  Combine SQLite's relational power with the simplicity of something like the `nedb` embedded database. That's what you get when you use trilogy. Since trilogy doesn't require any kind of build-step ala `sqlite3`, your build steps can be simpler.

- Powerful polymorphic API

  trilogy's API can let you do your thing in different ways. You can overload most of the functions to use them in varying ways by providing different arguments or leaving them out entirely. This is built using [arify][arify].

## Installation

`npm i trilogy`

## Usage

See the [documentation here][docs] for the full API - including usage syntax and examples.

## Contributing

I am open to input and discussion about the project. Feel free to open an issue or submit a pull request. For large changes, please open an issue to discuss the revisions first.

## License

MIT © Bo Lingen / citycide

See [LICENSE](LICENSE)

[sqljs]: https://github.com/kripken/sql.js
[knex]: https://github.com/tgriesser/knex
[electron]: https://github.com/electron/electron
[nwjs]: https://github.com/nwjs/nw.js
[arify]: https://github.com/citycide/arify
[docs]: https://citycide.github.io/trilogy/#/api
[mdnslice]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice
