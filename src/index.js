import Promise from 'bluebird'
import jetpack from 'fs-jetpack'
import arify from 'arify'
import knex from 'knex'
import SQL from 'sql.js'

import { resolve, isAbsolute } from 'path'

import constants from './constants'
import * as helpers from './helpers'
import { map, isBoolean, isFunction, isObject, isString } from './util'

class Trilogy {
  constructor (path, opts = {}) {
    if (!path) {
      throw new Error('Trilogy constructor must be provided a file path.')
    }

    if (!isAbsolute(path)) {
      let { dir = process.cwd() } = opts
      path = resolve(dir, path)
    }

    Object.assign(this, {
      path,
      db: null,
      verbose: isFunction(opts.verbose)
        ? opts.verbose
        : () => {},
      errorListener: isFunction(opts.errorListener)
        ? opts.errorListener
        : null
    })

    this.coercion = opts.coercion != null
      ? !!opts.coercion
      : helpers.coercion.active

    this._init()
  }

  /**
   * Initialize the instance and create or access the database file
   * @private
   */
  _init () {
    if (jetpack.exists(this.path) === 'file') {
      let file = jetpack.read(this.path, 'buffer')
      this.db = new SQL.Database(file)
    } else {
      this.db = new SQL.Database()
      this._write()
    }

    let kn = knex({ client: 'sqlite3', useNullAsDefault: true })

    Object.defineProperties(this, {
      knex: { get () { return kn } },
      sb: { get () { return kn.schema } }
    })
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
      let data = this.db.export()
      let buffer = new Buffer(data)

      jetpack.file(this.path, {
        content: buffer, mode: '777'
      })
    } catch (e) {
      this._errorHandler(e)
    }
  }

  /**
   * Execute a query on the database, ignoring its results.
   * @private
   */
  async run (query) {
    if (!this.db) {
      return this._errorHandler(constants.ERR_NO_DATABASE)
    }

    if (!isString(query)) {
      query = query.toString()
    }

    this.verbose(query)

    try {
      this.db.run(query)
      this._write()
    } catch (e) {
      throw e
    }
  }

  /**
   * Execute a query on the database and return its results.
   * @private
   */
  async exec (query) {
    if (!this.db) {
      return this._errorHandler(constants.ERR_NO_DATABASE)
    }

    if (!isString(query)) {
      query = query.toString()
    }

    this.verbose(query)

    try {
      return this.db.exec(query)
    } catch (e) {
      throw e
    }
  }

  async createTable (name, columns, options = {}) {
    let query
    if (isFunction(columns)) {
      query = this.sb.createTableIfNotExists(name, columns)
    } else {
      query = this.sb.createTableIfNotExists(name, table => {
        if (Array.isArray(columns)) {
          return helpers.processArraySchema(table, columns)
        } else if (isObject(columns)) {
          return helpers.processObjectSchema(table, columns)
        }

        if (options.compositeKey) {
          table.primary(options.compositeKey)
        }
      })
    }

    try {
      return this.run(query)
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  async hasTable (name) {
    try {
      let res = await this.count('sqlite_master', 'name', { name })
      return res > 0
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  async dropTable (name) {
    try {
      await this.run(this.sb.dropTable(name))
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  async insert (name, values, options = {}) {
    if (!name || !isString(name)) {
      return this._errorHandler('#insert', `'tableName' must be a string`)
    }

    let obj = map(values, v => {
      if (isBoolean(v)) {
        // without some kind of boolean coercion, the query will fail
        // native sqlite leans toward 0s and 1s for booleans
        // with coercion active we convert booleans to strings
        return this.coercion ? `${v}` : v | 0
      } else {
        return v
      }
    })

    let query = this.knex.table(name).insert(obj)

    // Knex doesn't have support for conflict clauses yet :(
    if (options.conflict) {
      let str = helpers.getConflictString(options.conflict)
      query = query.toString().replace('insert into', `insert${str}into`)
    }

    try {
      await this.run(query)
      return this.db.getRowsModified()
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  async select (...params) {
    return (arify(v => {
      v.str('table')
       .obj('options', { random: false })
       .add('columns', {
         test: value => isString(value) || Array.isArray(value),
         description: 'a string or an Array of strings',
         defaultValue: constants.DEFAULT_COLUMNS
       })
       .add('where', {
         test: value => helpers.isValidWhere(value),
         description: 'an Object or an Array of length 2 or 3',
         defaultValue: constants.DEFAULT_WHERE
       })
       .form('table', '?columns', '?where', '?options')
    }, async args => {
      let columns = helpers.sanitizeColumns(args.columns)

      let partial = this.knex.column(columns).table(args.table)
      let query = helpers.sanitizeWhere(args.where, partial)

      if (args.options.random) {
        query = query.orderByRaw('RANDOM()')
      } else if (args.options.order) {
        query = helpers.sanitizeOrder(args.options.order, partial)
      }

      try {
        let result = await this.exec(query)
        return helpers.parseResponse(result)
      } catch (e) {
        if (e.message.endsWith('of undefined')) {
          // the value probably just doesn't exist
          // resolve to undefined rather than reject
          return
        }
        return this._errorHandler(e)
      }
    }))(...params)
  }

  async first (...params) {
    let inner = async args => {
      let columns = helpers.sanitizeColumns(args.columns)

      let partial = this.knex.table(args.table).first(columns)
      let query = helpers.sanitizeWhere(args.where, partial)

      if (args.options.random) {
        query = query.orderByRaw('RANDOM()')
      }

      try {
        let result = await this.exec(query)
        return helpers.parseResponse(result)[0]
      } catch (e) {
        if (e.message.endsWith('of undefined')) {
          // the value probably just doesn't exist
          // resolve to undefined rather than reject
          return
        }

        return this._errorHandler(e)
      }
    }

    return (arify(v => {
      v.str('table')
       .obj('options', { random: false })
       .add('columns', {
         test: value => Array.isArray(value) || isString(value),
         description: 'a string or an Array of strings',
         defaultValue: constants.DEFAULT_COLUMNS
       })
       .add('where', {
         test: value => helpers.isValidWhere(value),
         description: 'an Object or an Array of length 2 or 3',
         defaultValue: constants.DEFAULT_WHERE
       })
       .form('table', '?columns', '?where', '?options')
    }, inner))(...params)
  }

  async getValue (...params) {
    let inner = async args => {
      let [tbl, col] = helpers.parseTablePath(args.table, args.column)

      if (!col) {
        return this._errorHandler(constants.ERR_COL_MISSING)
      }

      let partial = this.knex.table(tbl).first(col)
      let query = helpers.sanitizeWhere(args.where, partial)

      try {
        let result = await this.exec(query)
        return helpers.parseResponse(result)[0][col]
      } catch (e) {
        if (e.message.endsWith('of undefined')) {
          // the value probably just doesn't exist
          // resolve to undefined rather than reject
          return
        }
        return this._errorHandler(e)
      }
    }

    return (arify(v => {
      v.str('table')
       .str('column')
       .add('where', {
         test: value => helpers.isValidWhere(value),
         description: 'an Object or an Array of length 2 or 3',
         defaultValue: constants.DEFAULT_WHERE
       })
       .form('table', '?column', 'where')
    }, inner))(...params)
  }

  async update (...params) {
    let inner = async args => {
      let partial = this.knex.table(args.table)

      let col = map(args.values, v => {
        // without some kind of boolean coercion, the query will fail
        // native sqlite leans toward 0s and 1s for booleans
        // with coercion active we convert booleans to strings
        if (isBoolean(v)) {
          return this.coercion ? `${v}` : v | 0
        } else {
          return v
        }
      })

      let update = isObject(col)
        ? partial.update(col)
        : partial.update(...col)

      let query = helpers.sanitizeWhere(args.where, update)

      // Knex doesn't have support for conflict clauses yet :(
      if (args.options.conflict) {
        let str = helpers.getConflictString(args.options.conflict)
        query = query.toString().replace('update', `update${str}`)
      }

      try {
        await this.run(query)
        return this.db.getRowsModified()
      } catch (e) {
        return this._errorHandler(e)
      }
    }

    return (arify(v => {
      v.str('table')
       .obj('options', {})
       .add('values', {
         test: value => {
           return (
             isObject(value) || (Array.isArray(value) && value.length === 2)
           )
         },
         description: 'either an Object or an Array with a length of 2'
       })
       .add('where', {
         test: value => helpers.isValidWhere(value),
         description: 'an Object or an Array of length 2 or 3',
         defaultValue: constants.DEFAULT_WHERE
       })
       .form('table', 'values', '?where', '?options')
    }, inner))(...params)
  }

  async increment (...params) {
    let inner = async args => {
      let [tbl, col] = helpers.parseTablePath(args.table, args.column)

      if (!col) {
        return this._errorHandler(constants.ERR_COL_MISSING)
      }

      let partial = this.knex.table(tbl).increment(col, args.amount)
      let query = helpers.sanitizeWhere(args.where, partial)

      try {
        await this.run(query)
      } catch (e) {
        return this._errorHandler(e)
      }
    }

    return (arify(v => {
      v.str('table')
       .str('column')
       .num('amount', 1)
       .add('where', {
         test: value => helpers.isValidWhere(value),
         description: 'an Object or an Array of length 2 or 3',
         defaultValue: constants.DEFAULT_WHERE
       })
       .form('table', '?column', '?amount', '?where')
    }, inner))(...params)
  }

  async decrement (...params) {
    let inner = async args => {
      let [tbl, col] = helpers.parseTablePath(args.table, args.column)

      if (!col) {
        return this._errorHandler(constants.ERR_COL_MISSING)
      }

      let partial = this.knex.table(tbl)
      let rawStr = args.allowNegative
        ? `${col} - ${args.amount}`
        : `MAX(0, ${col} - ${args.amount})`
      let updated = partial.update({ [col]: this.knex.raw(rawStr) })
      let query = helpers.sanitizeWhere(args.where, updated)

      try {
        return this.run(query)
      } catch (e) {
        return this._errorHandler(e)
      }
    }

    return (arify(v => {
      v.str('table')
       .str('column')
       .num('amount', 1)
       .bln('allowNegative', false)
       .add('where', {
         test: value => helpers.isValidWhere(value),
         description: 'an Object or an Array of length 2 or 3',
         defaultValue: constants.DEFAULT_WHERE
       })
       .form('table', '?column', '?amount', '?where', '?allowNegative')
    }, inner))(...params)
  }

  async del (...params) {
    let inner = async args => {
      let partial = this.knex.table(args.table).del()
      let query = helpers.sanitizeWhere(args.where, partial)

      try {
        await this.run(query)
        return this.db.getRowsModified()
      } catch (e) {
        return this._errorHandler(e)
      }
    }

    return (arify(v => {
      v.str('table')
       .add('where', {
         test: value => helpers.isValidWhere(value),
         description: 'an Object or an Array of length 2 or 3',
         defaultValue: constants.DEFAULT_WHERE
       })
       .form('table', '?where')
    }, inner))(...params)
  }

  async count (...params) {
    let inner = args => {
      let partial
      if (args.options.distinct) {
        partial = this.knex.table(args.table).countDistinct(`${args.column} as count`)
      } else {
        partial = this.knex.table(args.table).count(`${args.column} as count`)
      }

      let query = helpers.sanitizeWhere(args.where, partial).toString()

      try {
        let statement = this.db.prepare(query)
        let res = statement.getAsObject({})

        if (isObject(res) && res.count) {
          return res.count
        } else {
          return 0
        }
      } catch (e) {
        return this._errorHandler(e)
      }
    }

    return (arify(v => {
      v.str('table', 'sqlite_master')
       .str('column', '*')
       .obj('options', { distinct: false })
       .add('where', {
         test: value => helpers.isValidWhere(value),
         description: 'an Object or an Array of length 2 or 3',
         defaultValue: constants.DEFAULT_WHERE
       })
       .form('?table', '?column', '?where', '?options')
    }, inner))(...params)
  }

  async raw (query, ret = false) {
    try {
      let done = ret ? this.exec(query) : this.run(query)
      return ret ? done : undefined
    } catch (e) {
      return this._errorHandler(e)
    }
  }

  get schemaBuilder () {
    return this.sb
  }

  get queryBuilder () {
    return this.knex
  }

  static get coercion () {
    return helpers.coercion.active
  }

  static set coercion (value) {
    helpers.coercion.active = !!value
    return !!value
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
  _errorHandler (err, msg = constants.ERR_UNKNOWN) {
    let e = new Error()

    if (err instanceof Error) {
      e = err
    } else if (isString(err)) {
      e.message = (arguments.length === 1)
        ? `${err}`
        : `${err} :: ${msg}`
    }

    e.name = 'TrilogyError'

    if (this.errorListener) {
      this.errorListener(e)
    }

    return Promise.reject(e)
  }
}

module.exports = Trilogy
