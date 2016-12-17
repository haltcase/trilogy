<a name="0.10.0"></a>
# [0.10.0](https://github.com/citycide/trilogy/compare/v0.9.2...v0.10.0) (2016-12-17)


### Bug Fixes

* **build:** revert babel config to es2015 base ([0e67048](https://github.com/citycide/trilogy/commit/0e67048))
* **tests:** fix error in deletion tests (#4) ([85160d8](https://github.com/citycide/trilogy/commit/85160d8)), closes [(#4](https://github.com/(/issues/4)
* **tests:** working directory discrepancy ([3330d92](https://github.com/citycide/trilogy/commit/3330d92))

### Features

* addt'l createTable forms, coercion config, modularize, cjs export ([d3bab02](https://github.com/citycide/trilogy/commit/d3bab02))
* change schemaBuilder & queryBuilder to getters ([4c82d3c](https://github.com/citycide/trilogy/commit/4c82d3c))


### BREAKING CHANGES

* Any instances of retrieving knex's schema or query builder through trilogy must now use for example: `db.queryBuilder.[method]` instead of `db.getQueryBuilder().[method]`. The same applies to schema builder.
* Any commonjs users `require`ing trilogy no longer need `.default` due to using commonjs export instead of Babel's `export default` fill.



<a name="0.9.2"></a>
## [0.9.2](https://github.com/citycide/trilogy/compare/v0.9.2...v0.9.2) (2016-09-14)




