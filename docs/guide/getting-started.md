# Getting started

::: tip PREREQUISITES
Before using trilogy please ensure you have [Node][node] 8.10 or newer
installed, as well as [Yarn][yarn], npm (which is bundled with Node),
or another JavaScript package manager for installing trilogy and friends.
:::

## Install trilogy

```sh
yarn add trilogy # or npm install trilogy
```

## Install a backend

You've got two choices here: the native C++ [`sqlite3`][sqlite3] driver
or the pure JavaScript [`sql.js`][sqljs] backend. For more information
and tips on which to choose, see [_"Backends"_](../reference/backends.md).

```sh
# native C++ driver (may require compilation toolchain)
yarn add sqlite3 # or npm install sqlite3

# pure JavaScript (no compilation necessary)
yarn add sql.js # or npm install sql.js
```

::: tip
You don't need to worry about this too much since you can swap between
these backends freely without affecting any of your code.
:::

## Import and use

Now that you've got trilogy and a backend installed you can start using it.
If you chose `sqlite3` as your backend no configuration is needed since it
is the default:

```ts
import { connect } from 'trilogy'

const db = connect('./storage.db')
```

In order to use `sql.js`, set `options.client` property to `'sql.js'`:

```ts
import { connect } from 'trilogy'

const db = connect('./storage.db', {
  client: 'sql.js'
})
```

And, regardless of which backend you chose, you can always use a memory-only
database for fast, unpersisted storage:

```ts
import { connect } from 'trilogy'

const dbNative = connect(':memory:')
const dbJS = connect(':memory:', { client: 'sql.js' })
```

You're up and running! If you need a full API reference, see [_"API"_](../reference/api.md).

[node]: https://nodejs.org/
[yarn]: https://yarnpkg.com/
[sqlite3]: https://github.com/mapbox/sqlite3
[sqljs]: https://github.com/kripken/sql.js
