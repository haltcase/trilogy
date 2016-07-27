import jetpack from 'fs-jetpack'
import Promise from 'bluebird'
import knex from 'knex'
import SQL from 'sql.js'
import _ from 'lodash'

/**
 * Trilogy
 * @class
 */
export default class Trilogy {
  /**
   * Creates a new datastore
   * @param {string} fileName - path where database should exist
   * @param {Object} [opt={}]
   */
  constructor (fileName, opt = {}) {
    if (!fileName) throw new Error('Trilogy constructor must be provided a file path.')

    Object.defineProperties(this, {
      fileName: { value: fileName },
      db: { value: null, configurable: true },
      debug: { value: opt.debug || false, configurable: true },
      verbose: { value: opt.verbose ? ::console.log : () => {}, configurable: true },
      errorListener: { value: _.isFunction(opt.errorListener) ? opt.errorListener : null }
    })

    this._init()
  }

  /**
   * Initialize the instance and create or access the database file
   * @private
   */
  _init () {
    try {
      const file = jetpack.read(this.fileName, 'buffer')

      Object.defineProperty(this, 'knex', {
        value: knex({ client: 'sqlite', useNullAsDefault: true })
      })

      Object.defineProperties(this, {
        db: { value: new SQL.Database(file) },
        sb: { value: this.knex.schema },
        tables: { value: new Map() }
      })
    } catch (e) {
      this._errorHandler(e)

      Object.defineProperty(this, 'db', {
        value: new SQL.Database()
      })

      this._write()._init()
    }
  }

  /**
   * Export the data in memory to the database file
   * @private
   */
  _write () {
    if (!this.db) {
      this._errorHandler('Could not write - no database initiated')
      return false
    }

    try {
      const data = this.db.export()
      const buffer = new Buffer(data)
      jetpack.write(this.fileName, buffer)
      return this
    } catch (e) {
      this._errorHandler(e)
    }
  }

  /**
   * Execute a query on the database, ignoring its results
   * @param {(Object|string)} query - any SQLite query string
   * @returns {Promise.<(boolean|Error)>} `true` if the query ran successfully, else an error
   *
   * @see {@link exec} if you need a return value
   */
  async run (query) {
    if (!this.db) {
      return this._errorHandler('Could not write - no database initiated')
    }

    if (!_.isString(query)) query = query.toString()
    this.verbose(query)

    try {
      this.db.run(query)
      this._write()
      return Promise.resolve(true)
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  /**
   * Execute a query on the database and return its results
   * @param {(Object|string)} query - any SQLite query string
   * @returns {Promise.<(Array|Error)>} an `Array` containing query results, else an `Error`
   *
   * @see {@link run} if you don't care about a return value
   */
  async exec (query) {
    if (!this.db) {
      return this._errorHandler('Could not write - no database initiated')
    }

    if (!_.isString(query)) query = query.toString()
    this.verbose(query)

    try {
      const val = this.db.exec(query)
      return Promise.resolve(val)
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  /**
   * Add a table to the database
   * @param {string} tableName
   * @param {Object[]} columns
   * @param {Object} [options]
   * @returns {Promise.<Trilogy>} resolves to the Trilogy instance
   */
  async createTable (tableName, columns, options = {}) {
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
      return Promise.resolve(this)
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  async createTableCallback (tableName, cb) {
    if (!_.isFunction(cb)) {
      return this._errorHandler('#createTableCallback', `2nd parameter must be a function`)
    }

    const query = this.sb.createTableIfNotExists(tableName, cb)

    try {
      await this.run(query)
      return Promise.resolve(this)
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  /**
   * Check if a table exists in the database
   * @param {string} tableName
   * @returns {Promise.<boolean>}
   */
  async hasTable (tableName) {
    const query = this.sb.hasTable(tableName)

    try {
      const res = await this.exec(query)
      if (!Array.isArray(res) || !res.length) {
        return Promise.resolve(false)
      }
      return Promise.resolve(true)
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  /**
   * Insert values into a table in the database
   * @param {string} tableName
   * @param {Object} values
   * @param {Object} [options={}]
   * @returns {Promise.<number>} The number of rows inserted
   */
  async insert (tableName, values, options = {}) {
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
   * @param {string} tableName
   * @param {(string|Array)} [columns=['*']]
   * @param {(Object|Array|function)} [where]
   * @param {Object} [options={}]
   * @returns {Promise.<Array>}
   */
  async select (tableName, columns = ['*'], where = ['1', '=', '1'], options = {}) {
    if (!tableName || !_.isString(tableName)) {
      return this._errorHandler('#select', `'tableName' must be a string`)
    }

    if (arguments.length === 2 && _.isPlainObject(columns)) {
      // assuming `columns` is actually an options object
      options = columns
      columns = ['*']
    }

    if (!Trilogy._isValidWhere(where)) {
      return this._errorHandler('#select', `'where' argument is invalid`)
    }

    columns = Trilogy._sanitizeColumns(columns)

    const partial = this.knex.column(columns).table(tableName)
    let query = Trilogy._sanitizeWhere(where, partial)

    if (options.random) {
      query = query.orderByRaw('RANDOM()')
    } else if (options.order) {
      query = Trilogy._sanitizeOrder(options.order, partial)
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
  }

  /**
   * Select the first row returned by the query
   * @param {string} tableName
   * @param {(string|Array)} [columns=['*']]
   * @param {(Object|Array|function)} [where]
   * @param {Object} [options={}]
   * @returns {Promise.<Object>}
   */
  async first (tableName, columns = ['*'], where = ['1', '=', '1'], options = {}) {
    if (!tableName || !_.isString(tableName)) {
      return this._errorHandler('#first', `'tableName' must be a string`)
    }

    if (arguments.length === 2 && _.isPlainObject(columns)) {
      // assuming `columns` is actually an options object
      options = columns
      columns = ['*']
    }

    if (!Trilogy._isValidWhere(where)) {
      return this._errorHandler('#first', `'where' argument is invalid`)
    }

    columns = Trilogy._sanitizeColumns(columns)

    const partial = this.knex.table(tableName).first(columns)
    let query = Trilogy._sanitizeWhere(where, partial)

    if (options.random) {
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
  }

  /**
   * Retrieve the value at a specific row in a specific column
   * @param {string} tableName
   * @param {string} column
   * @param {(Object|Array|function)} [where]
   */
  async getValue (tableName, column, where = ['1', '=', '1']) {
    if (!tableName || !_.isString(tableName)) {
      return this._errorHandler('#getValue', `'tableName' must be a string`)
    }

    if (!column || !_.isString(column) || column.includes(',')) {
      return this._errorHandler('#getValue', `'column' must be a single column name as a string`)
    }

    if (!Trilogy._isValidWhere(where)) {
      return this._errorHandler('#getValue', `'where' argument is invalid`)
    }

    const partial = this.knex.table(tableName).first(column)
    const query = Trilogy._sanitizeWhere(where, partial)

    try {
      const result = await this.exec(query)
      const res = Trilogy._parseResponse(result)
      return Promise.resolve(res[0][column])
    } catch (e) {
      if (e.message.endsWith('of undefined')) {
        // the value probably just doesn't exist
        // resolve to undefined rather than reject
        return Promise.resolve(undefined)
      }
      return this._errorHandler(e)
    }
  }

  /**
   * Update rows in the database
   * @param {string} tableName
   * @param {(Object|Array)} values
   * @param {(Object|Array|function)} [where]
   * @param {Object} [options={}]
   * @returns {Promise.<Number>} The number of rows affected
   */
  async update (tableName, values, where = ['1', '=', '1'], options = {}) {
    if (!tableName || !_.isString(tableName)) {
      return this._errorHandler('#update', `'tableName' must be a string`)
    }

    if (!_.isPlainObject(values) && !Array.isArray(values) || values.length !== 2) {
      return this._errorHandler('#update', `'values' must be either an object or key / value array`)
    }

    if (!Trilogy._isValidWhere(where)) {
      return this._errorHandler('#update', `'where' argument is invalid`)
    }

    const partial = this.knex.table(tableName)
    const update = _.isPlainObject(values) ? partial.update(values) : partial.update(...values)
    let query = Trilogy._sanitizeWhere(where, update)

    // Knex doesn't have support for conflict clauses yet :(
    if (options.conflict) {
      const str = Trilogy._getConflictString(options.conflict)
      query = query.toString().replace('update', `update${str}`)
    }

    try {
      await this.run(query)
      return Promise.resolve(this.db.getRowsModified())
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  /**
   * Increment a value at `column` by a specified `amount`
   * @param {string} tableName
   * @param {string} column
   * @param {number} [amount=1]
   * @param {(Object|Array|function)} [where]
   * @returns {Promise.<Trilogy>} resolves to the Trilogy instance
   */
  async increment (tableName, column, amount = 1, where = ['1', '=', '1']) {
    if (!tableName || !_.isString(tableName)) {
      return this._errorHandler('#increment', `'tableName' must be a string`)
    }

    if (arguments.length < 2) {
      return this._errorHandler('#increment', `invalid number of arguments`)
    }

    if (!Trilogy._isValidWhere(where)) {
      return this._errorHandler('#increment', `'where' argument is invalid`)
    }

    const partial = this.knex.table(tableName).increment(column, amount)
    const query = Trilogy._sanitizeWhere(where, partial)

    try {
      await this.run(query)
      return Promise.resolve(this)
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  /**
   * Decrement a value at `column` by a specified `amount`
   * @param {string} tableName
   * @param {string} column
   * @param {number} [amount=1]
   * @param {boolean} [allowNegative=false]
   * @param {(Object|Array|function)} [where]
   * @returns {Promise.<Trilogy>} resolves to the Trilogy instance
   */
  async decrement (tableName, column, amount = 1, where = ['1', '=', '1'], allowNegative = false) {
    if (!tableName || !_.isString(tableName)) {
      return this._errorHandler('#decrement', `'tableName' must be a string`)
    }

    if (arguments.length < 2) {
      return this._errorHandler('#decrement', `invalid number of arguments`)
    }

    if (!Trilogy._isValidWhere(where)) {
      return this._errorHandler('#decrement', `'where' argument is invalid`)
    }

    const partial = this.knex.table(tableName)
    const rawStr = allowNegative ? `${column} - ${amount}` : `MAX(0, ${column} - ${amount})`
    const updated = partial.update({ [column]: this.knex.raw(rawStr) })
    const query = Trilogy._sanitizeWhere(where, updated)

    try {
      await this.run(query)
      return Promise.resolve(this)
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  /**
   * Delete rows from a table
   * @param {string} tableName
   * @param {(Object|Array|function)} [where]
   * @returns {Promise.<number>} The number of rows deleted
   */
  async del (tableName, where = ['1', '=', '1']) {
    if (!tableName || !_.isString(tableName)) {
      return this._errorHandler('#del', `'tableName' must be a string`)
    }

    if (!Trilogy._isValidWhere(where)) {
      return this._errorHandler('#del', `'where' argument is invalid`)
    }

    const partial = this.knex.table(tableName).del()
    const query = Trilogy._sanitizeWhere(where, partial)

    try {
      await this.run(query)
      return Promise.resolve(this.db.getRowsModified())
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  /**
   * Select the first row returned by the query
   * @param {string} tableName
   * @param {String} [column='*']
   * @param {(Object|Array|function)} [where]
   * @param {Object} [options={}]
   * @returns {Promise.<number>} The number of rows (meeting criteria if supplied)
   */
  async count (tableName, column = '*', where = ['1', '=', '1'], options = {}) {
    if (!tableName || !_.isString(tableName)) {
      return this._errorHandler('#count', `'tableName' must be a string`)
    }

    if (arguments.length === 2 && _.isPlainObject(column)) {
      // assuming `column` is actually an options object
      options = column
      column = '*'
    }

    if (!_.isString(column)) {
      return this._errorHandler('#count', `'column' must be a string`)
    }

    if (!Trilogy._isValidWhere(where)) {
      return this._errorHandler('#count', `'where' argument is invalid`)
    }

    let partial
    if (options.distinct) {
      partial = this.knex.table(tableName).countDistinct(`${column} as count`)
    } else {
      partial = this.knex.table(tableName).count(`${column} as count`)
    }

    const query = Trilogy._sanitizeWhere(where, partial).toString()

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
  }

  /**
   * Execute arbitrary SQLite queries
   * @param {string} query
   * @param {boolean} ret - whether to return the result
   * @returns {Promise.<(Object|undefined)>}
   */
  async raw (query, ret) {
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
  getSchemaBuilder () {
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
  getQueryBuilder () {
    return this.knex
  }

  /**
   * Enable or disable verbose mode
   * Verbose mode logs all queries
   * @param {boolean} flag
   */
  setVerbose (flag) {
    if (arguments.length === 1) {
      Object.defineProperty(this, 'verbose', {
        value: flag ? ::console.log : () => {}
      })
    }
  }

  /**
   * Build an 'on conflict' clause query component
   * @param {string} conflict - the type of query to build
   * @returns {string} query component
   * @static
   * @private
   */
  static _getConflictString (conflict) {
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
  static _parseResponse (contents) {
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
  static _isValidWhere (where) {
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
  static _sanitizeColumns (columns) {
    if (Array.isArray(columns)) return columns
    if (_.isString(columns)) return [columns]
    return ['*']
  }

  /**
   * Complete a where query component based on type
   * Arrays are spread into arguments
   * Functions get bound to the knex instance
   * Objects are passed along as is
   * @param {(Object|Array|function)} where
   * @param {Object} partial - the current knex query chain
   * @returns {Object} a continued knex query chain
   * @static
   * @private
   */
  static _sanitizeWhere (where, partial) {
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
  static _sanitizeOrder (order, partial) {
    if (Array.isArray(order) && order.length === 2) {
      return partial.orderBy(...order)
    } else if (_.isString(order)) {
      return partial.orderBy(order)
    } else {
      return partial
    }
  }

  /**
   * Normalize errors to `Error` objects
   * If `err` is a string, it is used as the method path, with `msg` as the message
   * @param {(Error|string)} err
   * @param {string} [msg]
   * @returns {Promise.<Error>} a rejected promise with the `Error` object
   * @private
   */
  _errorHandler (err, msg = 'something went horribly wrong') {
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
