import knex from 'knex'
import { resolve } from 'path'

import Model from './model'
import * as types from './types'
import { readDatabase } from './sqljs-handler'
import { runQuery } from './helpers'
import { setup } from './enforcers'
import { invariant } from './util'

class Trilogy {
  constructor (path, options = {}) {
    if (!path) {
      throw new Error('trilogy constructor must be provided a file path.')
    }

    this.options = setup(options)
    this.options.connection.filename = resolve(this.options.dir, path)
    this.isNative = this.options.client === 'sqlite3'
    this.verbose = options.verbose

    let config = { client: 'sqlite3', useNullAsDefault: true }

    if (this.isNative) {
      this.knex = knex({ ...config, connection: this.options.connection })
    } else {
      this.knex = knex(config)
      readDatabase(this, this.options.connection.filename)
    }

    this.definitions = new Map()
  }

  get models () {
    return this.definitions.keys()
  }

  model (name, schema, options) {
    if (this.definitions.has(name)) {
      return this.definitions.get(name)
    }

    let model = new Model(this, name, schema, options)
    this.definitions.set(name, model)

    let check = this.knex.schema.hasTable(name)
    let query = this.knex.schema
      .createTableIfNotExists(name, types.toKnexSchema(model))

    if (this.isNative) {
      check.then(tableExists => {
        if (tableExists) return
        query.then(() => {})
      })
    } else {
      let exists = runQuery(this, check, true)
      if (!exists) runQuery(this, query)
    }

    return model
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

  count (location, criteria, options) {
    let [table, column] = location.split('.', 2)
    let model = checkModel(this, table)
    return model.count(column, criteria, options)
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
  return invariant(instance.definitions.get(name), `no such table '${name}'`)
}

export default Trilogy
