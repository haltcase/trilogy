<p align="center">
  <img src="https://rawgit.com/citycide/trilogy/master/media/logo.svg" width="420" alt="trilogy">
</p>

> ***trilogy*** is SQLite - but 100% pure JavaScript. Its core is built on two modules: [SQL.js][sqljs] for accessing and writing to database files and [knex][knex] for building its queries.

[![npm version](https://img.shields.io/npm/v/trilogy.svg?maxAge=2592000?style=flat-square)](https://www.npmjs.com/package/trilogy)
[![travis status](https://img.shields.io/travis/citycide/trilogy.svg?style=flat-square)](https://travis-ci.org/citycide/trilogy)
[![npm license](https://img.shields.io/npm/l/trilogy.svg?maxAge=2592000?style=flat-square)](LICENSE)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)

[sqljs]: https://github.com/kripken/sql.js
[knex]: https://github.com/tgriesser/knex

*note: trilogy is currently in active development and while it's currently in a high-functioning state, there may be bugs, untested features, and a lack of documentation.*

## Why?

You can stop building and rebuilding `sqlite3` for every platform - we already have a JS-only implementation in `SQL.js`. Forget about gyp or pre-gyp compilation issues.

You can stop writing raw, long and unwieldy query strings when `knex` can do the job easier and in a more JS-friendly syntax.

Best of all, think of the simplicity of something like the `nedb` embedded database. That's what you get when you use ***trilogy***.

## Installation

`npm i trilogy`

## Usage

See the [documentation here](https://citycide.github.io/trilogy/) for the full API - including usage syntax and examples.

## Contributing

I am open to input and discussion about the project. Feel free to open an issue or submit a pull request. For large changes, please open an issue to discuss the revisions first.

## License

MIT © Bo Lingen / citycide

See [LICENSE](LICENSE)
