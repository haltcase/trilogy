# Backends

trilogy supports several different backends, each with its own advantages.

* [`sqlite3`](#sqlite3)
* [`sql.js`](#sql-js)
* [memory-only](#memory-only)

Because trilogy supports each of these equally, you can choose any one of
them depending on which is the best fit for your project. And don't worry
too much about choosing the right one the first time since you can change
the backend at any time without affecting trilogy's behavior or changing
any of your code.

## [`sqlite3`](https://github.com/mapbox/node-sqlite3)

```js
const db = create('./storage.db', {
  client: 'sqlite3'
})

// or, since this is the default:
const db = create('./storage.db')
```

This is the predominant native asynchronous SQLite binding for Node. If you're
looking for performance this is a good place to start, and is inherently async.
However since this is a native C++ module it is required to build this against
your runtime environment. In most cases a precompiled binary can be downloaded
by [`node-pre-gyp`][sqlite3-installing].

Using `sqlite3` can sometimes be a hassle due to its C++ nature, `gyp`, `pre-gyp`,
Electron, different OS environments or architectures, Node versions, and so on
and so on. To help with situations where this is an issue trilogy also supports
a module that does _not_ require native compilation toolchains.

## [`sql.js`](https://github.com/kripken/sql.js)

```js
const db = create('./storage.db', {
  client: 'sql.js'
})
```

`sql.js` runs purely in JavaScript and has no native C++ dependency. On the
one hand, this means you can use it in almost any environment and will have no
trouble using it in the runtimes trilogy supports.

On the other hand this means performance likely isn't as stellar, and the
queries are run synchronously. Synchronous vs asynchronous seems to be a
[matter of debate][async-sync] when it comes to Node's competing SQLite
libraries, but trilogy normalizes both of these backends to Promises and
you won't need to interact with them differently.

## memory-only

```js
const db = create(':memory:')
```

Set the file path to exactly `:memory:` to disable persistence and store your
database entirely in memory. None of the data will be saved across sessions,
but queries are blazing fast due to the lack of I/O.

In-memory storage is great for tests &mdash; trilogy itself uses this for its
tests ([example][memory-example]) &mdash; and for performance when persisting
data isn't a requirement.

This is a SQLite feature supported by both of the above backends that you can
read more about [here][memory-ref].

## so... which one?

Which one you choose is dependent on your target environments. It's recommended
to start with `sqlite3` and build it as needed. If you face compatibility
issues that you'd rather not deal with, you can always switch to `sql.js` with
no changes to the rest of your code - trilogy handles them both in the same way.

If you maintain a cross-platform Electron app, for example, you can use `sql.js`
and you won't need to deal with the problems that led to stories like
[this][electron-1] or [this][electron-2] or [this][electron-3].

That last link describes the current best way to handle the native `sqlite3`
module in Electron &mdash; tools like [`electron-rebuild`][electron-rebuild]
have reduced a lot of frustration in using the native `sqlite3` module over
the `sql.js` alternative.

[async-sync]: https://github.com/JoshuaWise/better-sqlite3/issues/181
[sqlite3-installing]: https://github.com/mapbox/node-sqlite3#installing
[memory-example]: https://github.com/citycide/trilogy/blob/09ae5e6a385cb1b87c6ff1c6fb8122723c81ed64/tests/count.ts#L4
[memory-ref]: https://www.sqlite.org/inmemorydb.html
[electron-1]: http://kodgemisi.com/2015/09/using-sequelize-sqlite-electron-ubuntu-linux/
[electron-2]: https://www.bountysource.com/issues/36091005-electron-1-2-x-sqlite3-not-working-on-windows-dll-related-issue
[electron-3]: http://www.laurivan.com/make-electron-work-with-sqlite3/
[electron-rebuild]: https://github.com/electron/electron-rebuild
