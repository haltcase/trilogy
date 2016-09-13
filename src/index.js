/* @flow */

import Promise from 'native-or-lie'
import jetpack from 'fs-jetpack'
import arify from 'arify'
import knex from 'knex'
import SQL from 'sql.js'
import map from 'lodash.map'
import isPlainObject from 'is-plain-obj'

import constants from './constants'
import { isFunction, isString } from './util'

export default class Trilogy {
  fileName: string;
  verbose: Function;
  errorListener: Function | null;
  knex: any;
  db: any;
  sb: any;

  /**
   * Initialize a new datastore instance, creating an SQLite database
   * file at the `fileName` path if it does not yet exist, or reading
   * it if it does.
   *
   * @param {string} fileName
   *  Either a path to an existing database or the path at which one
   *  should be created.
   * @param {Object} [opts={}]
   * @param {Function} [opts.verbose]
   *  A function that will receive every query run against the database
   * @param {Function} [opts.errorListener]
   *  A function that receives any errors thrown during query execution
   * @throws if `fileName` is not provided
   *
   * @example
   *
   * import Trilogy from 'trilogy'
   *
   * const db = new Trilogy('./storage.db')
   *
   * // WITH OPTIONS:
   * // verbose function
   * const db = new Trilogy('./storage.db', {
   *   verbose: console.log.bind(console)
   * })
   *
   * // errorListener function
   * function errorHandler (err) {
   *   if (err.message === `Trilogy#createTable :: 'columns' must be an array`) {
   *     console.log('Crap. Should have read the docs!')
   *   }
   * }
   *
   * const db = new Trilogy('./storage.db', {
   *   errorListener: errorHandler
   * })
   */
  constructor (
    fileName: string,
    opts?: ClassOptions = {
      verbose: () => {},
      errorListener: null
    }
  ) {
    if (!fileName) throw new Error('Trilogy constructor must be provided a file path.')

    Object.assign(this, {
      fileName,
      db: null,
      verbose: isFunction(opts.verbose)
        ? opts.verbose
        : () => {},
      errorListener: isFunction(opts.errorListener)
        ? opts.errorListener
        : null
    })

    this._init()
  }

  /**
   * Initialize the instance and create or access the database file
   * @private
   */
  _init () {
    if (jetpack.exists(this.fileName)) {
      const file = jetpack.read(this.fileName, 'buffer')
      this.db = new SQL.Database(file)
    } else {
      this.db = new SQL.Database()
      this._write()
    }

    const kn = knex({ client: 'sqlite', useNullAsDefault: true })

    this.knex = kn
    this.sb = kn.schema
  }

  /**
   * Export the data in memory to the database file
   * @private
   */
  _write () {
    if (!this.db) {
      this._errorHandler(constants.ERR_NO_DATABASE)
    }

    try {
      const data = this.db.export()
      const buffer = new Buffer(data)

      jetpack.file(this.fileName, {
        content: buffer, mode: '777'
      })
    } catch (e) {
      this._errorHandler(e)
    }
  }

  /**
   * Execute a query on the database, ignoring its results.
   *
   * @param {(Object|string)} query
   *  Any SQLite query string. If an Object is provided, a `toString`
   *  conversion will be attempted in the case it's a knex query object.
   * @returns {Promise}
   *
   * @see {@link Trilogy#exec} if you need a return value
   */
  async run (query: Object | string): Promise<void|Error> {
    if (!this.db) {
      return this._errorHandler(constants.ERR_NO_DATABASE)
    }

    if (!isString(query)) query = query.toString()
    this.verbose(query)

    return new Promise((resolve, reject) => {
      try {
        this.db.run(query)
        this._write()
        return resolve()
      } catch (e) {
        return reject(e)
      }
    })
  }

  /**
   * Execute a query on the database and return its results.
   *
   * @param {(Object|string)} query
   *  Any SQLite query string. If an Object is provided, a `toString`
   *  conversion will be attempted in the case it's a knex query object.
   * @returns {Promise<Array>} an `Array` containing query result objects
   *
   * @see {@link Trilogy#run} if you don't care about a return value
   */
  async exec (query: Object | string): Promise<Array<Object>|Error> {
    if (!this.db) {
      return this._errorHandler(constants.ERR_NO_DATABASE)
    }

    if (!isString(query)) query = query.toString()
    this.verbose(query)

    return new Promise((resolve, reject) => {
      try {
        const val = this.db.exec(query)
        return resolve(val)
      } catch (e) {
        return reject(e)
      }
    })
  }

  /**
   * Add a table to the database. The `columns` argument must be an array of
   * either strings or Objects, which can be mixed and matched. String values
   * default to a column of the SQLite 'text' type. If another type is needed
   * or any other attributes, use an Object.
   *
   * All the properties of the supplied column Object are passed to knex. Some
   * attributes require no values, such as `primary` or `nullable`. In these
   * cases, their presence in the object is enough to add that flag.
   *
   * If the column property is not present in knex's methods it will be ignored.
   * See <a href="http://knexjs.org/#Schema-Building">knex's documentation</a>
   * on Schema Building for the available attributes when creating column tables.
   *
   * @param {string} tableName
   * @param {Object[]} columns
   * @param {Object} [options={}]
   * @param {string[]} [options.compositeKey]
   *  An array of column names as strings. A composite primary key will be
   *  created on all of these columns.
   * @returns {Promise}
   *
   * @example
   *
   * // `columns` should be an Array
   * // each item in the Array should be either a string or an Object
   *
   * // a string in the Array defaults to a text column in the table
   * db.createTable('people', ['email'])
   *
   * // use an object to specify other attributes
   * db.createTable('people', [
   *   { name: 'age', type: 'integer' }
   * ])
   *
   * // you can mix and match
   * db.createTable('people', [
   *   'name',
   *   { name: 'age', type: 'integer' },
   *   'email',
   *   // note that the value of `primary` doesn't make a difference
   *   // this would still be a primary key column
   *   { name: '', primary: false }
   * ])
   */
  async createTable (
    tableName: string,
    columns: Array<Object>,
    options: Object = {}
  ): Promise<void|Error> {
    if (!Array.isArray(columns) || !columns.length) {
      return this._errorHandler('#createTable', `'columns' must be an array`)
    }

    const query = this.sb.createTableIfNotExists(tableName, table => {
      map(columns, column => {
        if (isPlainObject(column)) {
          if (!column.name) return
          if (!column.type || !(column.type in table)) column.type = 'text'
          if ('unique' in column && column.unique === 'inline') {
            // bypass knex's usual unique method
            column['__TYPE__'] = `${column.type} unique`
            column.type = 'specificType'
            delete column.unique
          }

          let partial = table[column.type](column.name, column['__TYPE__'])
          map(column, (attr, prop: string) => {
            // name & type are handled above
            if (prop === 'name' || prop === 'type') return
            if (!(prop in partial)) return

            // handle methods that take no arguments
            switch (prop) {
              case 'unique':
              case 'primary':
              case 'notNull':
              case 'notNullable':
              case 'nullable':
              case 'unsigned':
                partial = partial[prop]()
                break
              default:
                partial = partial[prop](attr)
            }
          })
        } else if (isString(column)) {
          table.text(column)
        }
      })

      if ('compositeKey' in options) {
        table.primary(options.compositeKey)
      }
    })

    try {
      await this.run(query)
      return Promise.resolve()
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  /**
   * Check if a table exists in the database
   * @param {string} tableName
   * @returns {Promise<boolean>}
   */
  async hasTable (
    tableName: string
  ): Promise<boolean|Error> {
    try {
      const res = await this.count('sqlite_master', 'name', {
        name: tableName
      })

      return Promise.resolve(res > 0)
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  /**
   * Insert values into a table in the database.
   *
   * @param {string} tableName
   * @param {Object} values
   * @param {Object} [options={}]
   * @param {string} [options.conflict]
   *  An SQLite conflict type, one of: `fail`, `abort`, `ignore`,
   *  `replace`, `rollback`.
   * @returns {Promise<number>} The number of rows inserted
   *
   * @example
   *
   * db.insert('people', {
   *   name: 'Bob',
   *   age: 17
   * })
   *
   * // insert or replace
   * db.insert('people', {
   *   name: 'Bob',
   *   age: 17
   * }, { conflict: 'replace' })
   */
  async insert (
    tableName: string,
    values: Object,
    options?: { conflict?: string } = {}
  ): Promise<number|Error> {
    if (!tableName || !isString(tableName)) {
      return this._errorHandler('#insert', `'tableName' must be a string`)
    }

    let query = this.knex.table(tableName).insert(values)

    // Knex doesn't have support for conflict clauses yet :(
    if (options.conflict) {
      const str = Trilogy._getConflictString(options.conflict)
      query = query.toString().replace('insert into', `insert${str}into`)
    }

    try {
      await this.run(query)
      return Promise.resolve(this.db.getRowsModified())
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  /**
   * Execute a select query on the database. Allows overloading of arguments,
   * ie. `table` is the only required argument. In this case, `columns`
   * defaults to selecting all columns.
   *
   * @function
   * @name select
   * @memberOf Trilogy#
   *
   * @param {string} table
   * @param {(string|Array)} [columns=['*']]
   *  Defaults to selecting all columns.
   * @param {(Object|Array|Function)} [where=['1', '=', '1']]
   *  Defaults to no restriction on selection.
   * @param {Object} [options={}]
   * @param {boolean} [options.random=false]
   *  Pass `true` to return records in random order.
   * @returns {Promise<Array>}
   *
   * @example
   *
   * // select all records in the 'people' table
   * db.select('people')
   *
   * // select just the 'age' and 'favColor' columns where name is 'Bob'
   * db.select('people', ['age', 'favColor'], { name: 'Bob' })
   *
   * // select just 'name' where age is at least 18
   * db.select('people', 'age', ['age', '>=', '18'])
   */

  /**
   * @private
   */
  async select (...params: Array<mixed>): Promise<Array<Object>|Error> {
    return (arify(v => {
      v.str('table')
       .obj('options', { random: false })
       .add('columns', {
         test: (value: mixed): boolean => isString(value) || Array.isArray(value),
         description: 'a string or an array of strings',
         defaultValue: ['*']
       })
       .add('where', {
         test: (value: mixed): boolean => Trilogy._isValidWhere(value),
         description: 'an object, array, or function',
         defaultValue: ['1', '=', '1']
       })

      v.form('table', '?columns', '?where', '?options')
    }, async (args: Object): * => {
      const columns = Trilogy._sanitizeColumns(args.columns)

      const partial = this.knex.column(columns).table(args.table)
      let query = Trilogy._sanitizeWhere(args.where, partial)

      if (args.options.random) {
        query = query.orderByRaw('RANDOM()')
      } else if (args.options.order) {
        query = Trilogy._sanitizeOrder(args.options.order, partial)
      }

      try {
        const result = await this.exec(query)
        const res = Trilogy._parseResponse(result)
        return Promise.resolve(res)
      } catch (e) {
        if (e.message.endsWith('of undefined')) {
          // the value probably just doesn't exist
          // resolve to undefined rather than reject
          return Promise.resolve(undefined)
        }
        return this._errorHandler(e)
      }
    }))(...params)
  }

  /**
   * Return the first row selected by the query. Allows overloading
   * of arguments, ie. `table` is the only required argument. In this
   * case, `columns` defaults to selecting all columns.
   *
   * @function
   * @name first
   * @memberOf Trilogy#
   *
   * @param {string} table
   * @param {(string|Array)} [columns=['*']]
   *  Defaults to selecting all columns.
   * @param {(Object|Array|Function)} [where=['1', '=', '1']]
   *  Defaults to no restriction on selection.
   * @param {Object} [options={}]
   * @param {boolean} [options.random=false]
   *  Pass `true` to return a random record.
   * @returns {Promise<Object>}
   *
   * @example
   *
   * // select the first record in 'people'
   * db.first('people')
   *
   * // select a random record from 'people'
   * // the second argument is a where clause but is always true for all records
   * db.first('people', ['1', '=', '1'], { random: true })
   *
   * // NOTE:
   * // even with overloading, in this case `where` needs to be provided if we
   * // have an `options` object. this is because `where` could also be an object
   * // so the function has no way to know which one you meant to provide.
   */

  /**
   * @private
   */
  async first (...params: Array<mixed>): Promise<Object|Error> {
    return (arify(v => {
      v.str('table')
       .obj('options', { random: false })
       .add('columns', {
         test: (value: mixed): boolean => Array.isArray(value) || isString(value),
         description: 'a string or an array of strings',
         defaultValue: ['*']
       })
       .add('where', {
         test: (value: mixed): boolean => Trilogy._isValidWhere(value),
         description: 'an object, array, or function',
         defaultValue: ['1', '=', '1']
       })

      v.form('table', '?columns', '?where', '?options')
    }, async (args: Object): * => {
      const columns = Trilogy._sanitizeColumns(args.columns)

      const partial = this.knex.table(args.table).first(columns)
      let query = Trilogy._sanitizeWhere(args.where, partial)

      if (args.options.random) {
        query = query.orderByRaw('RANDOM()')
      }

      try {
        const result = await this.exec(query)
        const res = Trilogy._parseResponse(result)
        return Promise.resolve(res[0])
      } catch (e) {
        if (e.message.endsWith('of undefined')) {
          // the value probably just doesn't exist
          // resolve to undefined rather than reject
          return Promise.resolve(undefined)
        }
        return this._errorHandler(e)
      }
    }))(...params)
  }

  /**
   * Retrieve the value at a specific row in a specific column.
   * Allows function overloading, ie. `table` is the only required
   * argument. In this case, `column` must be provided as dot- or
   * bracket-notation syntax of `table.column` or `table[column]`.
   *
   * @function
   * @name getValue
   * @memberOf Trilogy#
   *
   * @param {string} table
   * @param {string} [column]
   *  If this argument is not explicitly provided, it must be
   *  included as part of `tableName` using either dot- or
   *  bracket-notation.
   * @param {(Object|Array|Function)} [where=['1', '=', '1']]
   *  Defaults to no restriction on selection.
   * @returns {Promise<*>}
   *
   * @example
   *
   * db.getValue('people', 'age', { name: 'Bob' })
   *
   * // dot- or bracket-notation of table and column
   * db.getValue('people.age', { name: 'Bob' })
   * db.getValue('people[age]', { name: 'Bob' })
   */

  /**
   * @private
   */
  async getValue (...params: Array<mixed>): Promise<mixed|Error> {
    return (arify(v => {
      v.str('table')
       .str('column')
       .add('where', {
         test: (value: mixed): boolean => Trilogy._isValidWhere(value),
         description: 'an object, array, or function',
         defaultValue: ['1', '=', '1']
       })

      v.form('table', '?column', 'where')
    }, async (args: Object): * => {
      const [tbl, col] = Trilogy._parseTablePath(args.table, args.column)

      if (!col) {
        return this._errorHandler(constants.ERR_COL_MISSING)
      }

      const partial = this.knex.table(tbl).first(col)
      const query = Trilogy._sanitizeWhere(args.where, partial)

      try {
        const result = await this.exec(query)
        const res = Trilogy._parseResponse(result)
        return Promise.resolve(res[0][col])
      } catch (e) {
        if (e.message.endsWith('of undefined')) {
          // the value probably just doesn't exist
          // resolve to undefined rather than reject
          return Promise.resolve(undefined)
        }
        return this._errorHandler(e)
      }
    }))(...params)
  }

  /**
   * Update rows in the database.
   *
   * @function
   * @name update
   * @memberOf Trilogy#
   *
   * @param {string} table
   * @param {(Object|Array)} values
   *  Must either be an object or a key / value array (length === 2)
   * @param {(Object|Array|Function)} [where=['1', '=', '1']]
   *  Defaults to no restriction on selection.
   * @param {Object} [options={}]
   * @param {string} [options.conflict]
   *  An SQLite conflict type, one of: `fail`, `abort`, `ignore`,
   *  `replace`, `rollback`.
   * @returns {Promise<number>} The number of rows affected
   *
   * @example
   *
   * db.update('people', { age: 18 }, { name: 'Bob' })
   */

  /**
   * @private
   */
  async update (...params: Array<mixed>): Promise<number|Error> {
    return (arify(v => {
      v.str('table')
       .obj('options', {})
       .add('values', {
         test: (value: mixed): boolean => {
           return (
             isPlainObject(value) || (Array.isArray(value) && value.length === 2)
           )
         },
         description: 'either an Object or an Array with a length of 2'
       })
       .add('where', {
         test: (value: mixed): boolean => Trilogy._isValidWhere(value),
         description: 'an object, array, or function',
         defaultValue: ['1', '=', '1']
       })

      v.form('table', 'values', '?where', '?options')
    }, async (args: Object): * => {
      const partial = this.knex.table(args.table)
      const update = isPlainObject(args.values)
        ? partial.update(args.values)
        : partial.update(...args.values)

      let query = Trilogy._sanitizeWhere(args.where, update)

      // Knex doesn't have support for conflict clauses yet :(
      if (args.options.conflict) {
        const str = Trilogy._getConflictString(args.options.conflict)
        query = query.toString().replace('update', `update${str}`)
      }

      try {
        await this.run(query)
        return Promise.resolve(this.db.getRowsModified())
      } catch (e) {
        return this._errorHandler(e)
      }
    }))(...params)
  }

  /**
   * Increment a value at `column` by a specified `amount`.
   * Allows function overloading, ie. `table` is the only
   * required argument. In that case, column must be provided
   * as part of `table` using dot- or bracket-notation. This
   * allows for a short-and-sweet syntax in the case you only
   * want to increment by 1.
   *
   * @function
   * @name increment
   * @memberOf Trilogy#
   *
   * @param {string} table
   * @param {string} [column]
   *  If this argument is not explicitly provided, it must be
   *  included as part of `tableName` using either dot- or
   *  bracket-notation.
   * @param {number} [amount=1]
   * @param {(Object|Array|Function)} [where=['1', '=', '1']]
   *  Defaults to no restriction on selection.
   * @returns {Promise}
   *
   * @example
   *
   * db.increment('people', 'age', 1, { name: 'Bob' })
   *
   * // we can make that much sweeter :)
   * db.increment('people.age', { name: 'Bob' })
   */

  /**
   * @private
   */
  async increment (...params: Array<mixed>): Promise<void|Error> {
    return (arify(v => {
      v.str('table')
       .str('column')
       .num('amount', 1)
       .add('where', {
         test: (value: mixed): boolean => Trilogy._isValidWhere(value),
         description: 'an object, array, or function',
         defaultValue: ['1', '=', '1']
       })

      v.form('table', '?column', '?amount', '?where')
    }, async (args: Object): * => {
      const [tbl, col] = Trilogy._parseTablePath(args.table, args.column)

      if (!col) {
        return this._errorHandler(constants.ERR_COL_MISSING)
      }

      const partial = this.knex.table(tbl).increment(col, args.amount)
      const query = Trilogy._sanitizeWhere(args.where, partial)

      try {
        await this.run(query)
        return Promise.resolve()
      } catch (e) {
        return this._errorHandler(e)
      }
    }))(...params)
  }

  /**
   * Decrement a value at `column` by a specified `amount`.
   * Allows function overloading, ie. `table` is the only
   * required argument. In that case, column must be provided
   * as part of `table` using dot- or bracket-notation. This
   * allows for a short-and-sweet syntax in the case you only
   * want to decrement by 1.
   *
   * @function
   * @name decrement
   * @memberOf Trilogy#
   *
   * @param {string} table
   * @param {string} [column]
   *  If this argument is not explicitly provided, it must be
   *  included as part of `tableName` using either dot- or
   *  bracket-notation.
   * @param {(Object|Array|Function)} [where=['1', '=', '1']]
   *  Defaults to no restriction on selection.
   * @param {boolean} allowNegative
   *  Unless set to `true`, the value will not be allowed to go
   *  below a value of `0`.
   * @returns {Promise}
   *
   * db.decrement('people', 'age', 1, { name: 'Bob' })
   *
   * // we can make that much sweeter :)
   * db.decrement('people.age', { name: 'Bob' })
   */

  /**
   * @private
   */
  async decrement (...params: Array<mixed>): Promise<void|Error> {
    return (arify(v => {
      v.str('table')
       .str('column')
       .num('amount', 1)
       .bln('allowNegative', false)
       .add('where', {
         test: (value: mixed): boolean => Trilogy._isValidWhere(value),
         description: 'an object, array, or function',
         defaultValue: ['1', '=', '1']
       })

      v.form('table', '?column', '?amount', '?where', '?allowNegative')
    }, async (args: Object): * => {
      const [tbl, col] = Trilogy._parseTablePath(args.table, args.column)

      if (!col) {
        return this._errorHandler(constants.ERR_COL_MISSING)
      }

      const partial = this.knex.table(tbl)
      const rawStr = args.allowNegative
        ? `${col} - ${args.amount}`
        : `MAX(0, ${col} - ${args.amount})`
      const updated = partial.update({ [col]: this.knex.raw(rawStr) })
      const query = Trilogy._sanitizeWhere(args.where, updated)

      try {
        await this.run(query)
        return Promise.resolve()
      } catch (e) {
        return this._errorHandler(e)
      }
    }))(...params)
  }

  /**
   * Delete rows from a table. Allows deletion of all records in
   * a table by passing only a table name.
   *
   * @function
   * @name del
   * @memberOf Trilogy#
   *
   * @param {string} table
   * @param {(Object|Array|Function)} [where=['1','=','1']]
   *  Defaults to no restriction on selection.
   * @returns {Promise<number>} The number of rows deleted
   *
   * @example
   *
   * // delete all records from 'people'
   * db.del('people')
   *
   * // delete only where age is under 21
   * db.del('people', ['age', '<', '21'])
   */

  /**
   * @private
   */
  async del (...params: Array<mixed>): Promise<number|Error> {
    return (arify(v => {
      v.str('table')
       .add('where', {
         test: (value: mixed): boolean => Trilogy._isValidWhere(value),
         description: 'an object, array, or function',
         defaultValue: ['1', '=', '1']
       })

      v.form('table', '?where')
    }, async (args: Object): * => {
      const partial = this.knex.table(args.table).del()
      const query = Trilogy._sanitizeWhere(args.where, partial)

      try {
        await this.run(query)
        return Promise.resolve(this.db.getRowsModified())
      } catch (e) {
        return this._errorHandler(e)
      }
    }))(...params)
  }

  /**
   * Return the number of rows, matching a criteria if specified.
   *
   * @function
   * @name count
   * @memberOf Trilogy#
   *
   * @param {string} table
   * @param {String} [column='*']
   *  Defaults to selecting all columns.
   * @param {(Object|Array|Function)} [where=['1','=','1']]
   *  Defaults to no restriction on selection.
   * @param {Object} [options={}]
   * @param {boolean} [options.distinct=false]
   *  Counts only unique values if `true`.
   * @returns {Promise<number>} The number of rows (meeting criteria if supplied)
   *
   * @example
   *
   * // given we have this data in our 'people' table:
   * // |  name   |   age   |
   * // |  Bob    |   18    |
   * // |  Dale   |   25    |
   * // |  Harry  |   32    |
   *
   * db.count('people')
   * // -> 3
   *
   * // given we have tables `people`, `places`, `things`, & `ideas`
   * // thanks to function overloading we can do this
   * // to count number of tables in the database:
   *
   * db.count()
   * // -> 4
   */

  /**
   * @private
   */
  count (...params: Array<mixed>): Promise<number|Error> {
    return (arify(v => {
      v.str('table', 'sqlite_master')
       .str('column', '*')
       .obj('options', { distinct: false })
       .add('where', {
         test: (value: mixed): boolean => Trilogy._isValidWhere(value),
         description: 'an object, array, or function',
         defaultValue: ['1', '=', '1']
       })

      v.form('?table', '?column', '?where', '?options')
    }, (args: Object): * => {
      let partial
      if (args.options.distinct) {
        partial = this.knex.table(args.table).countDistinct(`${args.column} as count`)
      } else {
        partial = this.knex.table(args.table).count(`${args.column} as count`)
      }

      const query = Trilogy._sanitizeWhere(args.where, partial).toString()

      try {
        const statement = this.db.prepare(query)
        const res = statement.getAsObject({})

        if (isPlainObject(res) && 'count' in res) {
          return Promise.resolve(res.count)
        } else {
          return Promise.resolve(0)
        }
      } catch (e) {
        return this._errorHandler(e)
      }
    }))(...params)
  }

  /**
   * Execute arbitrary SQLite queries. You can either write your
   * own queries as you would with typical SQLite, or you can build
   * them with knex and use the knex `toString` method before passing
   * it here.
   *
   * Pass `true` as the second argument to return the results, otherwise
   * the query will be assumed to be execution only.
   *
   * @param {string} query
   *  Any arbitrary SQLite query string
   * @param {boolean} ret
   *  Pass `true` to return the results of the query
   * @returns {Promise<(Object|undefined)>}
   */
  async raw (
    query: string,
    ret?: boolean = false
  ): Promise<Object|void|Error> {
    try {
      const done = ret ? await this.exec(query) : await this.run(query)
      return Promise.resolve(ret ? done : undefined)
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  /**
   * Exposes the Knex schema builder object
   * @returns {Object}
   *
   * @see {@link Trilogy#raw} to run queries built with this
   */
  getSchemaBuilder (): Object {
    /**
     * @prop sb
     * @type {Object}
     * @memberOf this
     */
    return this.sb
  }

  /**
   * Exposes the Knex query builder object
   * @returns {Object}
   *
   * @see {@link Trilogy#raw} to run queries built with this
   */
  getQueryBuilder (): Object {
    return this.knex
  }

  /**
   * Build an 'on conflict' clause query component
   * @param {string} conflict - the type of query to build
   * @returns {string} query component
   * @static
   * @private
   */
  static _getConflictString (conflict: string): string {
    switch (conflict.toLowerCase()) {
      case 'fail': return ' or fail '
      case 'abort': return ' or abort '
      case 'ignore': return ' or ignore '
      case 'replace': return ' or replace '
      case 'rollback': return ' or rollback '
      default: return ' '
    }
  }

  /**
   * Parse an sql.js return value into a sane JS array
   * @param {Array} contents
   * @returns {Array}
   * @static
   * @private
   */
  static _parseResponse (contents: Array<Object>): Array<Object> {
    if (contents.length) {
      const columns = contents[0].columns
      const values = contents[0].values
      const results = []
      for (let i = 0; i < values.length; i++) {
        let line = {}
        for (let j = 0; j < columns.length; j++) {
          line[columns[j]] = values[i][j]
        }
        results.push(line)
      }
      return results
    } else {
      return []
    }
  }

  /**
   * Check that a where argument is a valid type
   * Valid types are: Object | Array | Function
   * @param {*} where
   * @returns {boolean}
   * @static
   * @private
   */
  static _isValidWhere (where: any): boolean {
    if (isPlainObject(where)) return true

    if (Array.isArray(where)) {
      const len = where.length
      return len === 2 || len === 3
    }

    return isFunction(where)
  }

  /**
   * Normalize a columns argument to an Array
   * Returns ['*'] if the input is not a string or Array
   * This means it defaults to 'all columns'
   * @param {*} columns
   * @returns {Array}
   * @static
   * @private
   */
  static _sanitizeColumns (
    columns: string | Array<string>
  ): Array<string> {
    if (Array.isArray(columns)) return columns
    if (isString(columns)) return [columns]
    return ['*']
  }

  /**
   * Complete a where query component based on type
   * Arrays are spread into arguments
   * Functions get bound to the knex instance
   * Objects are passed along as is
   * @param {(Object|Array|Function)} where
   * @param {Object} partial - the current knex query chain
   * @returns {Object} a continued knex query chain
   * @static
   * @private
   */
  static _sanitizeWhere (where: Function|Array<string>, partial: Object): Object {
    if (Array.isArray(where)) {
      return partial.where(...where)
    } else if (isFunction(where)) {
      return partial.where(where.bind(partial))
    } else {
      // it's an object
      return partial.where(where)
    }
  }

  /**
   * Complete an 'order by' query component
   * Arrays are spread into arguments
   * Strings are passed along as is
   * @param {(Array|string)} order
   * @param {Object} partial - the current knex query chain
   * @returns {Object} a continued knex query chain
   * @private
   */
  static _sanitizeOrder (
    order: Array<mixed> | string,
    partial: Object
  ): Object {
    if (Array.isArray(order) && order.length === 2) {
      return partial.orderBy(...order)
    } else if (isString(order)) {
      return partial.orderBy(order)
    } else {
      return partial
    }
  }

  /**
   * Parse a dot-notated path into table, column, & row
   * @param {string} table
   * @param {string} column
   * @param {string} row
   * @returns {Array<string>}
   * @private
   */
  static _parseTablePath (
    table: string,
    column: ?string,
    row: ?string
  ): Array<?string> {
    if (table.includes('.')) {
      const [top, inner, nested] = table.split('.')
      return Trilogy._parseTablePath(top, inner, nested)
    } else if (table.includes('[')) {
      const opener = table.indexOf('[')
      const closer = table.indexOf(']', opener)

      const top = table.substr(0, opener)
      const inner = table.slice(opener + 1, closer)

      const rowIndex = top.length + inner.length + 2

      let extra, nested
      if (rowIndex < table.length) {
        extra = table.slice(rowIndex + 1)
        const rowCloser = extra.indexOf(']')
        nested = extra.substr(0, rowCloser)
      }

      return Trilogy._parseTablePath(top, inner, nested)
    } else {
      return [table, column, row]
    }
  }

  /**
   * Normalize errors to `Error` objects. If `err` is a string,
   * it is used as the method path, with `msg` as the message.
   * If an `errorListener` function was provided in the constructor,
   * it will be called with the resulting error.
   *
   * @param {(string|Error)} err
   * @param {string} [msg]
   * @returns {Promise<Error>} a rejected promise with the `Error` object
   * @private
   */
  _errorHandler (
    err: string | Error,
    msg?: string = constants.ERR_UNKNOWN
  ): Promise<Error> {
    let e = new Error()

    if (err instanceof Error) {
      e = err
    } else if (isString(err)) {
      e.message = (arguments.length === 1)
        ? `Trilogy :: ${err}`
        : `Trilogy${err} :: ${msg}`
    }

    e.name = 'TrilogyError'

    if (this.errorListener) {
      this.errorListener(e)
    }

    return Promise.reject(e)
  }
}
