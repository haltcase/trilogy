import knex from 'knex'
import { resolve } from 'path'

import Model from './model'
import { toKnexSchema } from './types'
import { connect } from './sqljs-handler'
import { runQuery } from './helpers'
import { invariant } from './util'
import { setup, modelOptions } from './enforcers'

class Trilogy {
  constructor (path, options = {}) {
    if (!path) {
      throw new Error('trilogy constructor must be provided a file path')
    }

    let obj = this.options = setup(options)
    obj.connection.filename = resolve(obj.dir, path)
    this.isNative = obj.client === 'sqlite3'
    this.verbose = obj.verbose

    let config = { client: 'sqlite3', useNullAsDefault: true }

    if (this.isNative) {
      this.knex = knex({ ...config, connection: obj.connection })
    } else {
      this.knex = knex(config)
      this.pool = connect(this)
    }

    this.definitions = new Map()
  }

  get models () {
    return [...this.definitions.keys()]
  }

  model (name, schema, options) {
    if (this.definitions.has(name)) {
      return this.definitions.get(name)
    }

    let model = new Model(this, name, schema, options)
    this.definitions.set(name, model)

    let check = this.knex.schema.hasTable(name)
    let query = this.knex.schema
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
      return runQuery({ instance: this, check, needResponse: true })
        .then(exists => {
          if (exists) return model
          return runQuery({ instance: this, query })
        })
    }
  }

  hasModel (name) {
    if (!this.definitions.has(name)) {
      return false
    }

    let query = this.knex.schema.hasTable(name)
    return runQuery({ instance: this, query, needResponse: true })
  }

  dropModel (name) {
    if (!this.definitions.has(name)) {
      return false
    }

    let query = this.knex.schema.dropTableIfExists(name)
    return runQuery({ instance: this, query, needResponse: true }).then(() => {
      this.definitions.delete(name)
    })
  }

  raw (query, needResponse) {
    return runQuery({ instance: this, query, needResponse })
  }

  close () {
    if (this.isNative) {
      return this.knex.destroy()
    } else {
      return this.pool.drain()
    }
  }

  create (table, object, options) {
    let model = checkModel(this, table)
    return model.create(object, options)
  }

  find (location, criteria, options) {
    let [table, column] = location.split('.', 2)
    let model = checkModel(this, table)
    return model.find(column, criteria, options)
  }

  findOne (location, criteria, options) {
    let [table, column] = location.split('.', 2)
    let model = checkModel(this, table)
    return model.findOne(column, criteria, options)
  }

  findOrCreate (table, criteria, creation, options) {
    let model = checkModel(this, table)
    return model.findOrCreate(criteria, creation, options)
  }

  update (table, criteria, data, options) {
    let model = checkModel(this, table)
    return model.update(criteria, data, options)
  }

  updateOrCreate (table, criteria, data, options) {
    let model = checkModel(this, table)
    return model.updateOrCreate(criteria, data, options)
  }

  get (location, criteria, defaultValue) {
    let [table, column] = location.split('.', 2)
    let model = checkModel(this, table)
    return model.get(column, criteria, defaultValue)
  }

  set (location, criteria, value) {
    let [table, column] = location.split('.', 2)
    let model = checkModel(this, table)
    return model.set(column, criteria, value)
  }

  incr (location, criteria, amount) {
    let [table, column] = location.split('.', 2)
    let model = checkModel(this, table)
    return model.incr(column, criteria, amount)
  }

  decr (location, criteria, amount, allowNegative) {
    let [table, column] = location.split('.', 2)
    let model = checkModel(this, table)
    return model.decr(column, criteria, amount, allowNegative)
  }

  remove (location, criteria) {
    let model = checkModel(this, location)
    return model.remove(criteria)
  }

  clear (location) {
    let model = checkModel(this, location)
    return model.clear()
  }

  count (location, criteria, options) {
    if (arguments.length === 0) {
      let query = this.knex('sqlite_master')
        .whereNot('name', 'sqlite_sequence')
        .where({ type: 'table' })
        .count('* as count')

      return runQuery({ instance: this, query, needResponse: true })
        .then(([{ count }]) => count)
    }

    let [table, column] = location.split('.', 2)
    let model = checkModel(this, table)
    return column
      ? model.count(column, criteria, options)
      : model.count(criteria, options)
  }

  min (location, criteria, options) {
    let [table, column] = location.split('.', 2)
    let model = checkModel(this, table)
    return model.min(column, criteria, options)
  }

  max (location, criteria, options) {
    let [table, column] = location.split('.', 2)
    let model = checkModel(this, table)
    return model.max(column, criteria, options)
  }
}

function checkModel (instance, name) {
  return invariant(
    instance.definitions.get(name),
    `no model defined by the name '${name}'`
  )
}

export default Trilogy
