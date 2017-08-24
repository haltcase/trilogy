import knex from 'knex'
import { dirname, resolve } from 'path'
import { openSync, closeSync } from 'fs'

import Model from './model'
import { toKnexSchema } from './types'
import { runQuery } from './helpers'
import { invariant, makeDirPath } from './util'
import { setup, modelOptions } from './enforcers'
import { connect, readDatabase } from './sqljs-handler'

class Trilogy {
  constructor (path, options = {}) {
    if (!path) {
      throw new Error('trilogy constructor must be provided a file path')
    }

    const obj = this.options = setup(options)

    if (path === ':memory:') {
      obj.connection.filename = path
    } else {
      obj.connection.filename = resolve(obj.dir, path)

      // ensure the directory exists
      makeDirPath(dirname(obj.connection.filename))
    }

    this.isNative = obj.client === 'sqlite3'
    this.verbose = obj.verbose

    const config = { client: 'sqlite3', useNullAsDefault: true }

    if (this.isNative) {
      if (path !== ':memory:') {
        touchFile(obj.connection.filename)
      }

      this.knex = knex({ ...config, connection: obj.connection })
    } else {
      this.knex = knex(config)
      this.pool = connect(this)
      readDatabase(this)
    }

    this.definitions = new Map()
  }

  get models () {
    return [...this.definitions.keys()]
  }

  model (name, schema, options) {
    if (this.definitions.has(name)) {
      return Promise.resolve(this.definitions.get(name))
    }

    const model = new Model(this, name, schema, options)
    this.definitions.set(name, model)

    const check = this.knex.schema.hasTable(name)
    const query = this.knex.schema
      .createTableIfNotExists(name,
        toKnexSchema(model, modelOptions(options))
      )

    // we still check to see if the table exists to prevent
    // errors from creating indices that already exist

    if (this.isNative) {
      return check.then(exists => {
        if (exists) return model
        return query.then(() => model)
      })
    } else {
      return runQuery(this, check, true).then(exists => {
        if (exists) return model
        return runQuery(this, query).then(() => model)
      })
    }
  }

  hasModel (name) {
    if (!this.definitions.has(name)) {
      return Promise.resolve(false)
    }

    const query = this.knex.schema.hasTable(name)
    return runQuery(this, query, true)
  }

  dropModel (name) {
    if (!this.definitions.has(name)) {
      return Promise.resolve(false)
    }

    const query = this.knex.schema.dropTableIfExists(name)
    return runQuery(this, query, true).then(() => {
      this.definitions.delete(name)
    })
  }

  raw (query, needResponse) {
    return runQuery(this, query, needResponse)
  }

  close () {
    if (this.isNative) {
      return this.knex.destroy()
    } else {
      return this.pool.drain()
    }
  }

  create (table, object, options) {
    const model = checkModel(this, table)
    return model.create(object, options)
  }

  find (location, criteria, options) {
    const [table, column] = location.split('.', 2)
    const model = checkModel(this, table)
    return model.find(column, criteria, options)
  }

  findOne (location, criteria, options) {
    const [table, column] = location.split('.', 2)
    const model = checkModel(this, table)
    return model.findOne(column, criteria, options)
  }

  findOrCreate (table, criteria, creation, options) {
    const model = checkModel(this, table)
    return model.findOrCreate(criteria, creation, options)
  }

  update (table, criteria, data, options) {
    const model = checkModel(this, table)
    return model.update(criteria, data, options)
  }

  updateOrCreate (table, criteria, data, options) {
    const model = checkModel(this, table)
    return model.updateOrCreate(criteria, data, options)
  }

  get (location, criteria, defaultValue) {
    const [table, column] = location.split('.', 2)
    const model = checkModel(this, table)
    return model.get(column, criteria, defaultValue)
  }

  set (location, criteria, value) {
    const [table, column] = location.split('.', 2)
    const model = checkModel(this, table)
    return model.set(column, criteria, value)
  }

  getRaw (location, criteria, defaultValue) {
    const [table, column] = location.split('.', 2)
    const model = checkModel(this, table)
    return model.getRaw(column, criteria, defaultValue)
  }

  setRaw (location, criteria, value) {
    const [table, column] = location.split('.', 2)
    const model = checkModel(this, table)
    return model.setRaw(column, criteria, value)
  }

  incr (location, criteria, amount) {
    const [table, column] = location.split('.', 2)
    const model = checkModel(this, table)
    return model.incr(column, criteria, amount)
  }

  decr (location, criteria, amount, allowNegative) {
    const [table, column] = location.split('.', 2)
    const model = checkModel(this, table)
    return model.decr(column, criteria, amount, allowNegative)
  }

  remove (location, criteria) {
    const model = checkModel(this, location)
    return model.remove(criteria)
  }

  clear (location) {
    const model = checkModel(this, location)
    return model.clear()
  }

  count (location, criteria, options) {
    if (arguments.length === 0) {
      const query = this.knex('sqlite_master')
        .whereNot('name', 'sqlite_sequence')
        .where({ type: 'table' })
        .count('* as count')

      return runQuery(this, query, true)
        .then(([{ count }]) => count)
    }

    const [table, column] = location.split('.', 2)
    const model = checkModel(this, table)
    return column
      ? model.count(column, criteria, options)
      : model.count(criteria, options)
  }

  min (location, criteria, options) {
    const [table, column] = location.split('.', 2)
    const model = checkModel(this, table)
    return model.min(column, criteria, options)
  }

  max (location, criteria, options) {
    const [table, column] = location.split('.', 2)
    const model = checkModel(this, table)
    return model.max(column, criteria, options)
  }
}

function touchFile (atPath) {
  try {
    closeSync(openSync(atPath, 'wx'))
  } catch (e) {}
}

function checkModel (instance, name) {
  return invariant(
    instance.definitions.get(name),
    `no model defined by the name '${name}'`
  )
}

export default Trilogy
