<a name="1.4.4"></a>
### [`1.4.4`](https://github.com/citycide/trilogy/compare/v1.4.3...v1.4.4) (2018-01-09)


###### BUG FIXES

* **enforcers:** `groupBy` -> `group` ([3eaed9a](https://github.com/citycide/trilogy/commit/3eaed9a))


---

<a name="1.4.3"></a>
### [`1.4.3`](https://github.com/citycide/trilogy/compare/v1.4.2...v1.4.3) (2018-01-09)


###### BUG FIXES

* handle tuple where clauses correctly ([efbea74](https://github.com/citycide/trilogy/commit/efbea74))


---

<a name="1.4.2"></a>
### [`1.4.2`](https://github.com/citycide/trilogy/compare/v1.4.1...v1.4.2) (2017-12-08)


###### BUG FIXES

* **create:** prevent error while searching for last object ([5379bb5](https://github.com/citycide/trilogy/commit/5379bb5))
* **types:** handle nullish values when casting ([e8193c6](https://github.com/citycide/trilogy/commit/e8193c6)), closes [#79](https://github.com/citycide/trilogy/issues/79)


###### PERFORMANCE

* **util:** use `indexOf` instead of `some()` ([559dbe0](https://github.com/citycide/trilogy/commit/559dbe0))

---

<a name="1.4.1"></a>
### [`1.4.1`](https://github.com/citycide/trilogy/compare/v1.4.0...v1.4.1) (2017-11-16)

Small patch for TypeScript users to correctly export types.

###### BUG FIXES

* **types**: fix TypeScript typings (#75) @IKnowBashFu

---

<a name="1.4.0"></a>
### [`1.4.0`](https://github.com/citycide/trilogy/compare/v1.3.0...v1.4.0) (2017-11-04)


###### FEATURES

* **model:** allow multiple indices in model definitions, [#72](https://github.com/citycide/trilogy/pull/72) ([07ebe16](https://github.com/citycide/trilogy/commit/07ebe16))

---

<a name="1.3.0"></a>
### [`1.3.0`](https://github.com/citycide/trilogy/compare/v1.2.1...v1.3.0) (2017-08-24)

This release brings a pair of exciting features!

First up is the ability to define getters and setters when creating models.
These are useful for things like formatting after selects and making sure
conforming data before inserts.

```js
const people = await db.model('people', {
  name: String,
  username: {
    type: String,
    get (username) {
      return `username is: ${username}`
    },
    set (username) {
      // remove anything that isn't alphanumeric or underscore
      return username.replace(/[^\w]/gi, '')
    }
  }
})

await people.create({
  name: 'Bo Lingen',
  username: 'ci.ty]ci[d/e'
})
// -> { name: 'Bo Lingen', username: 'citycide' }

await people.get('username', { name: 'Bo Lingen' })
// -> 'username is: citycide'

// can use `getRaw()` and `setRaw()` to bypass getters / setters
// other methods may also accept a `raw` property in their options object
await people.getRaw('username', { name: 'Bo Lingen' })
// -> 'citycide'
```

There's also a new memory-only mode - if the file path is exactly ':memory:',
no file will be created and an in-memory store will be used. This doesn't
persist any data but is useful for speed and performance reasons. For example,
most of trilogy's tests now use in-memory databases to avoid tons of disk usage.

```js
const db = new Trilogy(':memory:')
```


###### BUG FIXES

* always return promises in async functions ([009f079](https://github.com/citycide/trilogy/commit/009f079))

###### FEATURES

* add support for in-memory database ([8587f4b](https://github.com/citycide/trilogy/commit/8587f4b))
* add getters & setters ([ab5cd7b](https://github.com/citycide/trilogy/commit/ab5cd7b))
* add `getRaw()` & `setRaw()` ([5fe1f80](https://github.com/citycide/trilogy/commit/5fe1f80))

###### PERFORMANCE

* **model:** use assignments in constructor ([73e6ebd](https://github.com/citycide/trilogy/commit/73e6ebd))
* **util:** optimize `each()` and `map()` ([040084d](https://github.com/citycide/trilogy/commit/040084d))

---

<a name="1.2.1"></a>
### [`1.2.1`](https://github.com/citycide/trilogy/compare/v1.2.0...v1.2.1) (2017-07-25)


###### BUG FIXES

* immediately create db file for both clients ([7423312](https://github.com/citycide/trilogy/commit/7423312))
* fix `.mjs` module by removing `module.exports` usage ([e1d57c3](https://github.com/citycide/trilogy/commit/e1d57c3))

---

<a name="1.2.0"></a>
### [`1.2.0`](https://github.com/citycide/trilogy/compare/v1.1.0...v1.2.0) (2017-06-09)


###### FEATURES

* add initial Flow definitions ([b9937b4](https://github.com/citycide/trilogy/commit/b9937b4))
* add initial TypeScript definitions ([3d9a2a5](https://github.com/citycide/trilogy/commit/3d9a2a5))
* support multiple where clauses ([ff481bb](https://github.com/citycide/trilogy/commit/ff481bb)), closes [#54](https://github.com/citycide/trilogy/issues/54)

---

<a name="1.1.0"></a>
### [`1.1.0`](https://github.com/citycide/trilogy/compare/v1.0.0...v1.1.0) (2017-03-23)


###### BUG FIXES

* **findOne:** error when no result and column provided ([7394150](https://github.com/citycide/trilogy/commit/7394150))


###### FEATURES

* drop fs-jetpack dependency ([4a82ab6](https://github.com/citycide/trilogy/commit/4a82ab6))

---

<a name="1.0.0"></a>
### [`1.0.0`](https://github.com/citycide/trilogy/compare/v1.0.0-rc.5...v1.0.0) (2017-03-16)

We've officially arrived at **1.0.0**!

But don't let that stop you from submitting issues if you come across problems,
or pull requests if there's something that can be improved or added.

Thanks for the help getting here!

###### BUG FIXES

* **incr|decr:** do nothing with amounts of 0 ([94dd9e0](https://github.com/citycide/trilogy/commit/94dd9e0))

---

<a name="1.0.0-rc.5"></a>
### [`1.0.0-rc.5`](https://github.com/citycide/trilogy/compare/v1.0.0-rc.4...v1.0.0-rc.5) (2017-02-26)

This is probably the last release candidate before 1.0.0!

...

I feel like I've said that before.

###### BUG FIXES

* **update:** handle type definitions on update ([eeda08c](https://github.com/citycide/trilogy/commit/eeda08c)), closes [#31](https://github.com/citycide/trilogy/issues/31)

---

<a name="1.0.0-rc.4"></a>
### [`1.0.0-rc.4`](https://github.com/citycide/trilogy/compare/v1.0.0-rc.3...v1.0.0-rc.4) (2017-02-24)

This is probably the last release candidate before 1.0.0!

###### BUG FIXES

* **native:** ensure directory exists ([f142cf4](https://github.com/citycide/trilogy/commit/f142cf4))
* **package:** update fs-jetpack to version 0.11.0 ([481a8d6](https://github.com/citycide/trilogy/commit/481a8d6))
* **package:** update fs-jetpack to version 0.12.0 ([3157627](https://github.com/citycide/trilogy/commit/3157627))

---

<a name="1.0.0-rc.3"></a>
### [`1.0.0-rc.3`](https://github.com/citycide/trilogy/compare/v1.0.0-rc.2...v1.0.0-rc.3) (2017-02-04)

This release contains a breaking change regarding the return value of `create()`.
You can follow the discussion leading up to this change in
[#21](https://github.com/citycide/trilogy/issues/21),
[#22](https://github.com/citycide/trilogy/pull/22),
& [#24](https://github.com/citycide/trilogy/pull/24).

Many thanks to [**@jonataswalker**](https://github.com/jonataswalker) who put in a lot of effort for this one.

###### BUG FIXES

* **create:** last object when auto-increment key ([6c8acc1](https://github.com/citycide/trilogy/commit/6c8acc1))
* **create:** native vs `sql.js` last object handling ([06cfca0](https://github.com/citycide/trilogy/commit/06cfca0))
* **model:** `sql.js` not returning model on creations ([06df94f](https://github.com/citycide/trilogy/commit/06df94f))
* **tests.model:** `create()` expected return value ([baa6ad3](https://github.com/citycide/trilogy/commit/baa6ad3))

##### FEATURES

* **create:** return the created object ([e551bbd](https://github.com/citycide/trilogy/commit/e551bbd))

###### PEFORMANCE

* optimize `findLastObject` helper ([e90cdff](https://github.com/citycide/trilogy/commit/e90cdff))


###### BREAKING CHANGES

* create: The return value of `create()` is no longer the number of created objects. Instead, `create()` returns the created object.

---

<a name="1.0.0-rc.2"></a>
### [`1.0.0-rc.2`](https://github.com/citycide/trilogy/compare/v1.0.0-rc.1...v1.0.0-rc.2) (2017-01-17)


###### BUG FIXES

* only require `sql.js` if not using `sqlite3` ([123149d](https://github.com/citycide/trilogy/commit/123149d)), closes [#18](https://github.com/citycide/trilogy/issues/18)

---

<a name="1.0.0-rc.1"></a>
### [`1.0.0-rc.1`](https://github.com/citycide/trilogy/compare/v0.11.1...v1.0.0-rc.1) (2017-01-13)

:raised_hands: Welcome to the very first official release candidate of Trilogy! :raised_hands:

The next version will be v1.0.0 unless there are any significant issues discovered.

There have not been significant changes since v0.11.1.

###### BUG FIXES

* **enforcers:** broken descriptor validation ([459a485](https://github.com/citycide/trilogy/commit/459a485))

###### FEATURES

* **types:** add `Array` and `Object` as valid types ([421d079](https://github.com/citycide/trilogy/commit/421d079))

---

<a name="0.11.1"></a>
### [`0.11.1`](https://github.com/citycide/trilogy/compare/v0.10.0...v0.11.1) (2017-01-10)

This is a small feature patch on top of v0.11.0 adding `model()` options
that include the ability to set compound primary keys, multiple unique
properties, and add timestamp properties (`created_at` and `updated_at`).

> Note: the changes below are mostly from v0.11.0.

###### BUG FIXES

* **enforcers:** verbose option validation ([b000a5e](https://github.com/citycide/trilogy/commit/b000a5e))
* **findOne:** sqlite3 response is an object ([2f71f5f](https://github.com/citycide/trilogy/commit/2f71f5f))
* **model:** argument handling with no column ([e76343c](https://github.com/citycide/trilogy/commit/e76343c))
* **model:** make `model()` async ([e3d57f6](https://github.com/citycide/trilogy/commit/e3d57f6))
* **native:** fix affected row return value for native queries ([2233a0f](https://github.com/citycide/trilogy/commit/2233a0f))
* **native:** query return types ([7519f9e](https://github.com/citycide/trilogy/commit/7519f9e))
* **query:** return type should always be Promise ([31cfed7](https://github.com/citycide/trilogy/commit/31cfed7))
* `models` list type ([f77aae5](https://github.com/citycide/trilogy/commit/f77aae5))
* model existence check ([5591860](https://github.com/citycide/trilogy/commit/5591860))

###### FEATURES

* add `hasModel()`, `dropModel()`, and `close()` ([00c0d66](https://github.com/citycide/trilogy/commit/00c0d66))
* add `raw()` method for custom queries ([2403e27](https://github.com/citycide/trilogy/commit/2403e27))
* change `groupBy` usages to `group` ([772b252](https://github.com/citycide/trilogy/commit/772b252))
* initial commit for rewrite (#14) ([26f739f](https://github.com/citycide/trilogy/commit/26f739f))
* **clear:** add `clear()` method, safeguard `remove()` ([ab671c1](https://github.com/citycide/trilogy/commit/ab671c1))
* **count:** add ability to count tables in the database ([de9a62d](https://github.com/citycide/trilogy/commit/de9a62d))
* **create:** make `create()` return # rows affected ([695753e](https://github.com/citycide/trilogy/commit/695753e))
* **model:** add model options ([dcc874e](https://github.com/citycide/trilogy/commit/dcc874e))
* **schema:** add `index` as a valid column attribute ([8873e34](https://github.com/citycide/trilogy/commit/8873e34))
* **sql.js:** add connection pool for managing sq.js backend ([2df8381](https://github.com/citycide/trilogy/commit/2df8381))
* **types:** add `'timestamp'` property type ([6bd0710](https://github.com/citycide/trilogy/commit/6bd0710))


###### BREAKING CHANGES

Major breakage inbound. See [#14](https://github.com/citycide/trilogy/issues/14) for more info
and useful migration tips.

---

<a name="0.10.0"></a>
### [`0.10.0`](https://github.com/citycide/trilogy/compare/v0.9.2...v0.10.0) (2016-12-17)


###### BUG FIXES

* **build:** revert babel config to es2015 base ([0e67048](https://github.com/citycide/trilogy/commit/0e67048))
* **tests:** fix error in deletion tests (#4) ([85160d8](https://github.com/citycide/trilogy/commit/85160d8)), closes [#4](https://github.com/citycide/trilogy/issues/4)
* **tests:** working directory discrepancy ([3330d92](https://github.com/citycide/trilogy/commit/3330d92))

###### FEATURES

* addt'l createTable forms, coercion config, modularize, cjs export ([d3bab02](https://github.com/citycide/trilogy/commit/d3bab02))
* change schemaBuilder & queryBuilder to getters ([4c82d3c](https://github.com/citycide/trilogy/commit/4c82d3c))


###### BREAKING CHANGES

* Any instances of retrieving knex's schema or query builder through trilogy must now use for example: `db.queryBuilder.[method]` instead of `db.getQueryBuilder().[method]`. The same applies to schema builder.
* Any commonjs users `require`ing trilogy no longer need `.default` due to using commonjs export instead of Babel's `export default` fill.

---

<a name="0.9.2"></a>
### [`0.9.2`](https://github.com/citycide/trilogy/compare/v0.9.2...v0.9.2) (2016-09-14)
