/* @flow */

import jetpack from 'fs-jetpack'
import arify from 'arify'
import Promise from 'bluebird'
import knex from 'knex'
import SQL from 'sql.js'
import _ from 'lodash'

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
      verbose: _.isFunction(opts.verbose)
        ? opts.verbose
        : () => {},
      errorListener: _.isFunction(opts.errorListener)
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

    this.knex = knex({ client: 'sqlite', useNullAsDefault: true })

    this.sb = this.knex.schema
  }

  /**
   * Export the data in memory to the database file
   * @private
   */
  _write () {
    if (!this.db) {
      this._errorHandler('Could not write - no database initiated')
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
   * Execute a query on the database, ignoring its results
   * @param {(Object|string)} query - any SQLite query string
   * @returns {Promise}
   *
   * @see {@link exec} if you need a return value
   */
  async run (query: Object | string): Promise<void> {
    if (!this.db) {
      return this._errorHandler('Could not write - no database initiated')
    }

    if (!_.isString(query)) query = query.toString()
    this.verbose(query)

    return new Promise((resolve: Function, reject: Function): Promise => {
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
   * Execute a query on the database and return its results
   * @param {(Object|string)} query - any SQLite query string
   * @returns {Promise<Array>} an `Array` containing query result objects
   *
   * @see {@link run} if you don't care about a return value
   */
  async exec (query: Object | string): Promise<Array<Object>> {
    if (!this.db) {
      return this._errorHandler('Could not write - no database initiated')
    }

    if (!_.isString(query)) query = query.toString()
    this.verbose(query)

    return new Promise((resolve: Function, reject: Function): Promise => {
      try {
        const val = this.db.exec(query)
        return resolve(val)
      } catch (e) {
        return reject(e)
      }
    })
  }

  /**
   * Add a table to the database
   * @param {string} tableName
   * @param {Object[]} columns
   * @param {Object} [options]
   * @returns {Promise}
   */
  async createTable (
    tableName: string,
    columns: Array<Object>,
    options: Object = {}
  ): Promise<void> {
    if (!Array.isArray(columns) || !columns.length) {
      return this._errorHandler('#createTable', `'columns' must be an array`)
    }

    const query = this.sb.createTableIfNotExists(tableName, table => {
      _.map(columns, column => {
        if (_.isPlainObject(column)) {
          if (!column.name) return
          if (!column.type || !(column.type in table)) column.type = 'text'
          let partial = table[column.type](column.name)

          _.map(column, (attr, prop) => {
            // name & type are handled above
            if (prop === 'name' || prop === 'type') return
            if (!(prop in partial)) return

            // handle methods that take no arguments
            switch (prop) {
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
        } else if (_.isString(column)) {
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
  ): Promise<boolean> {
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
   * Insert values into a table in the database
   * @param {string} tableName
   * @param {Object} values
   * @param {Object} [options={}]
   * @returns {Promise<number>} The number of rows inserted
   */
  async insert (
    tableName: string,
    values: Object,
    options?: { conflict?: string } = {}
  ): Promise<number> {
    if (!tableName || !_.isString(tableName)) {
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
   * Execute a select query on the database
   * @function
   * @name select
   * @memberOf Trilogy#
   *
   * @param {string} tableName
   * @param {(string|Array)} [columns=['*']]
   * @param {(Object|Array|Function)} [where=['1', '=', '1']]
   * @param {Object} [options={}]
   * @returns {Promise<Array>}
   */

  /**
   * @private
   */
  async select (...params: Array<mixed>): Promise<Array<Object>> {
    return (arify(v => {
      v.str('table')
       .obj('options', { random: false })
       .add('columns', {
         test: (value: mixed): boolean => _.isString(value) || Array.isArray(value),
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
   * Select the first row returned by the query
   * @function
   * @name first
   * @memberOf Trilogy#
   *
   * @param {string} tableName
   * @param {(string|Array)} [columns=['*']]
   * @param {(Object|Array|Function)} [where=['1', '=', '1']]
   * @param {Object} [options={}]
   * @param {boolean} [options.random=false]
   *  Pass `true` to return a random record
   * @returns {Promise<Object>}
   */

  /**
   * @private
   */
  async first (...params: Array<mixed>): Promise<Object> {
    return (arify(v => {
      v.str('table')
       .obj('options', { random: false })
       .add('columns', {
         test: (value: mixed): boolean => Array.isArray(value) || _.isString(value),
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
   * Retrieve the value at a specific row in a specific column
   * @function
   * @name getValue
   * @memberOf Trilogy#
   *
   * @param {string} tableName
   * @param {string} [column]
   * @param {(Object|Array|Function)} [where=['1', '=', '1']]
   * @returns {Promise<*>}
   */

  /**
   * @private
   */
  async getValue (...params: Array<mixed>): Promise<mixed> {
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
        return this._errorHandler(
          `column name is required. Pass it as an independent argument or as
           dot-notation along with the table argument.
           Check citycide.github.io/trilogy/Trilogy.html#decrement for more.`
        )
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
   * Update rows in the database
   * @function
   * @name update
   * @memberOf Trilogy#
   *
   * @param {string} tableName
   * @param {(Object|Array)} values
   * @param {(Object|Array|Function)} [where=['1', '=', '1']]
   * @param {Object} [options={}]
   * @returns {Promise<number>} The number of rows affected
   */

  /**
   * @private
   */
  async update (...params: Array<mixed>): Promise<number> {
    return (arify(v => {
      v.str('table')
       .obj('options', {})
       .add('values', {
         test: (value: mixed): boolean => {
           return (
             _.isPlainObject(value) || (Array.isArray(value) && value.length === 2)
           )
         }
       })
       .add('where', {
         test: (value: mixed): boolean => Trilogy._isValidWhere(value),
         description: 'an object, array, or function',
         defaultValue: ['1', '=', '1']
       })

      v.form('table', 'values', '?where', '?options')
    }, async (args: Object): * => {
      const partial = this.knex.table(args.table)
      const update = _.isPlainObject(args.values)
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
   * Increment a value at `column` by a specified `amount`
   * @function
   * @name increment
   * @memberOf Trilogy#
   *
   * @param {string} tableName
   * @param {string} [column]
   * @param {number} [amount=1]
   * @param {(Object|Array|Function)} [where=['1', '=', '1']]
   * @returns {Promise}
   */

  /**
   * @private
   */
  async increment (...params: Array<mixed>): Promise<void> {
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
        return this._errorHandler(
          `column name is required. Pass it as an independent argument or as
           dot-notation along with the table argument.
           Check citycide.github.io/trilogy/Trilogy.html#decrement for more.`
        )
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
   * Decrement a value at `column` by a specified `amount`
   * @function
   * @name decrement
   * @memberOf Trilogy#
   *
   * @param {string} tableName
   * @param {string} [column]
   * @param {(Object|Array|Function)} [where=['1', '=', '1']]
   * @returns {Promise}
   */

  /**
   * @private
   */
  async decrement (...params: Array<mixed>): Promise<void> {
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
        return this._errorHandler(
          `column name is required. Pass it as an independent argument or as
           dot-notation along with the table argument.
           Check citycide.github.io/trilogy/Trilogy.html#decrement for more.`
        )
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
   * Delete rows from a table
   * @function
   * @name del
   * @memberOf Trilogy#
   *
   * @param {string} tableName
   * @param {(Object|Array|Function)} [where=['1','=','1']]
   * @returns {Promise<number>} The number of rows deleted
   */

  /**
   * @private
   */
  async del (...params: Array<mixed>): Promise<number> {
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
   * Select the first row returned by the query
   * @function
   * @name count
   * @memberOf Trilogy#
   *
   * @param {string} tableName
   * @param {String} [column='*']
   * @param {(Object|Array|Function)} [where=['1','=','1']]
   * @param {Object} [options={distinct:false}]
   * @returns {Promise<number>} The number of rows (meeting criteria if supplied)
   */

  /**
   * @private
   */
  count (...params: Array<mixed>): Promise<number> {
    return (arify(v => {
      v.str('table')
       .str('column', '*')
       .obj('options', { distinct: false })
       .add('where', {
         test: (value: mixed): boolean => Trilogy._isValidWhere(value),
         description: 'an object, array, or function',
         defaultValue: ['1', '=', '1']
       })

      v.form('table', '?column', '?where', '?options')
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

        if (_.isPlainObject(res) && 'count' in res) {
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
   * Execute arbitrary SQLite queries
   * @param {string} query
   *  Any arbitrary SQLite query string
   * @param {boolean} ret
   *  Pass `true` to return the results of the query
   * @returns {Promise<(Object|undefined)>}
   */
  async raw (
    query: string,
    ret?: boolean = false
  ): Promise<Object | void> {
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
   * @see {@link raw} to run queries built with this
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
   * @see {@link raw} to run queries built with this
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
    if (_.isPlainObject(where)) return true

    if (Array.isArray(where)) {
      const len = where.length
      return len === 2 || len === 3
    }

    return _.isFunction(where)
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
    if (_.isString(columns)) return [columns]
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
  static _sanitizeWhere (where: Object | Array<string> | Function, partial: Object): Object {
    if (Array.isArray(where)) {
      return partial.where(...where)
    } else if (_.isFunction(where)) {
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
    } else if (_.isString(order)) {
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
   * Normalize errors to `Error` objects
   * If `err` is a string, it is used as the method path, with `msg` as the message
   * @param {(string|Error)} err
   * @param {string} [msg]
   * @returns {Promise<Error>} a rejected promise with the `Error` object
   * @private
   */
  _errorHandler (
    err: string | Error,
    msg?: string = 'something went horribly wrong'
  ): Promise<?Error> {
    let e = err
    if (_.isString(err)) {
      if (arguments.length === 1) {
        e = new Error(`Trilogy :: ${err}`)
      } else {
        e = new Error(`Trilogy${err} :: ${msg}`)
      }
    }

    if (this.errorListener) {
      this.errorListener(e)
    } else {
      return Promise.reject(e)
    }
  }
}
