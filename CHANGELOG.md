<a name="0.11.1"></a>
## [0.11.1](https://github.com/citycide/trilogy/compare/v0.10.0...v0.11.1) (2017-01-10)

This is a small feature patch on top of v0.11.0 adding `model()` options
that include the ability to set compound primary keys, multiple unique
properties, and add timestamp properties (`created_at` and `updated_at`).

> Note: the changes below are mostly from v0.11.0.

### Bug Fixes

* **enforcers:** verbose option validation ([b000a5e](https://github.com/citycide/trilogy/commit/b000a5e))
* **findOne:** sqlite3 response is an object ([2f71f5f](https://github.com/citycide/trilogy/commit/2f71f5f))
* **model:** argument handling with no column ([e76343c](https://github.com/citycide/trilogy/commit/e76343c))
* **model:** make `model()` async ([e3d57f6](https://github.com/citycide/trilogy/commit/e3d57f6))
* **native:** fix affected row return value for native queries ([2233a0f](https://github.com/citycide/trilogy/commit/2233a0f))
* **native:** query return types ([7519f9e](https://github.com/citycide/trilogy/commit/7519f9e))
* **query:** return type should always be Promise ([31cfed7](https://github.com/citycide/trilogy/commit/31cfed7))
* `models` list type ([f77aae5](https://github.com/citycide/trilogy/commit/f77aae5))
* model existence check ([5591860](https://github.com/citycide/trilogy/commit/5591860))

### Features

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


### BREAKING CHANGES

Major breakage inbound. See [#14](https://github.com/citycide/trilogy/issues/14) for more info
and useful migration tips.



<a name="0.10.0"></a>
# [0.10.0](https://github.com/citycide/trilogy/compare/v0.9.2...v0.10.0) (2016-12-17)


### Bug Fixes

* **build:** revert babel config to es2015 base ([0e67048](https://github.com/citycide/trilogy/commit/0e67048))
* **tests:** fix error in deletion tests (#4) ([85160d8](https://github.com/citycide/trilogy/commit/85160d8)), closes [#4](https://github.com/citycide/trilogy/issues/4)
* **tests:** working directory discrepancy ([3330d92](https://github.com/citycide/trilogy/commit/3330d92))

### Features

* addt'l createTable forms, coercion config, modularize, cjs export ([d3bab02](https://github.com/citycide/trilogy/commit/d3bab02))
* change schemaBuilder & queryBuilder to getters ([4c82d3c](https://github.com/citycide/trilogy/commit/4c82d3c))


### BREAKING CHANGES

* Any instances of retrieving knex's schema or query builder through trilogy must now use for example: `db.queryBuilder.[method]` instead of `db.getQueryBuilder().[method]`. The same applies to schema builder.
* Any commonjs users `require`ing trilogy no longer need `.default` due to using commonjs export instead of Babel's `export default` fill.



<a name="0.9.2"></a>
## [0.9.2](https://github.com/citycide/trilogy/compare/v0.9.2...v0.9.2) (2016-09-14)




