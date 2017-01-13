# Choosing a Backend

## overview

Trilogy supports two different SQLite backends:

### option 1 : [`sqlite3`](https://github.com/mapbox/node-sqlite3)

```js
const db = new Trilogy('./storage.db', {
  client: 'sqlite3'
})
   
// or, since this is the default:
const db = new Trilogy('./storage.db')
```

This is the predominant native asynchronous SQLite binding for Node. If you're
looking for performance this is a good place to start, and is inherently async.
However being a native module it is required to build this against your runtime
environment.
   
This can sometimes be a hassle due to `gyp`, `pre-gyp`, Electron, different OS
environments or architectures, Node versions, and so on and so on. To help with 
situations where this is an issue Trilogy also supports a module that does _not_
require building.

### option 2 : [`sql.js`](https://github.com/kripken/sql.js)

```js
const db = new Trilogy('./storage.db', {
  client: 'sql.js'
})
```

`sql.js` runs purely in JavaScript and does not have native C bindings. On the
one hand, this means you can use it in almost any environment. For Trilogy this
means you won't have any issues using it in a runtime using Node >=4.7.

On the other hand this means performance likely isn't as stellar, and the queries
are run synchronously. Trilogy still normalizes it into Promises however so that
the two backends have no differences to you.
   
## so... which one?

Which one you choose is dependent on your target environments. I'd recommend
starting with `sqlite3` and building it as needed. If you face compatibility
issues that you'd rather not deal with, you can always switch to `sql.js` with
no changes to the rest of your code - Trilogy handles them both in the same way.

If you maintain a cross-platform Electron app, for example, you can use `sql.js`
and you won't need to deal with the problems that led to stories like
[this](http://kodgemisi.com/2015/09/using-sequelize-sqlite-electron-ubuntu-linux/)
or [this](https://www.bountysource.com/issues/36091005-electron-1-2-x-sqlite3-not-working-on-windows-dll-related-issue)
or finally, [this](http://www.laurivan.com/make-electron-work-with-sqlite3/).

That last link describes the current best way to handle the native `sqlite3`
module in Electron - use [`electron-rebuild`](https://github.com/electron/electron-rebuild).
In all honesty, this method takes almost all the pain out of going native
over using the `sql.js` alternative. 
   
