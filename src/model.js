import * as types from './types'
import * as helpers from './helpers'
import * as enforcers from './enforcers'
import { isArray, isString, isObject, isNil } from './util'

export default class Model {
  constructor (ctx, name, schema, options) {
    this.ctx = ctx
    this.name = name
    this.options = options
    this.schema = schema
  }

  create (object, options) {
    const insertion = types.toDefinition(this, object)

    const query = this.ctx.knex.raw(
      this.ctx.knex(this.name)
        .insert(insertion)
        .toString()
        .replace(/^insert/i, 'INSERT OR IGNORE')
    )

    return helpers.runQuery(this.ctx, query)
      .then(() => helpers.findLastObject(this, object))
      .then(res => res || this.findOne(object))
  }

  find (column, criteria, options = {}) {
    if (column && !isString(column)) {
      options = criteria
      criteria = column
      column = ''
    }

    options = enforcers.findOptions(options)

    const order = options.random ? 'random' : options.order
    let query = this.ctx.knex(this.name).select()
    query = helpers.buildWhere(query, criteria)

    if (order) query = helpers.buildOrder(query, order)
    if (options.limit) query = query.limit(options.limit)
    if (options.skip) query = query.offset(options.skip)

    return helpers.runQuery(this.ctx, query, true)
      .then(response => {
        if (!isArray(response)) {
          return response ? [response] : []
        }

        return response.map(object => {
          if (!column) {
            return types.fromDefinition(this, object)
          } else {
            return types.fromColumnDefinition(this, column, object[column])
          }
        })
      })
  }

  findOne (column, criteria, options = {}) {
    if (column && !isString(column)) {
      options = criteria
      criteria = column
      column = ''
    }

    options = enforcers.findOptions(options)

    const order = options.random ? 'random' : options.order
    let query = this.ctx.knex(this.name).first()
    query = helpers.buildWhere(query, criteria)

    if (order) query = helpers.buildOrder(query, order)
    if (options.skip) query = query.offset(options.skip)

    return helpers.runQuery(this.ctx, query, true).then(response => {
      const result = isArray(response) ? response[0] : response
      if (isNil(result)) return result

      if (!column) {
        return types.fromDefinition(this, result)
      } else {
        // if a column was provided, skip casting
        // the entire object and just process then
        // return that particular property
        return types.fromColumnDefinition(this, column, result[column])
      }
    })
  }

  findOrCreate (criteria, creation, options) {
    return this.findOne(criteria, options)
      .then(existing => {
        if (existing) return existing
        return this.create({ ...criteria, ...creation })
      })
  }

  update (criteria, data, options) {
    const typedData = types.toDefinition(this, data)
    const typedCriteria = types.toDefinition(this, criteria)
    let query = this.ctx.knex(this.name).update(typedData)
    query = helpers.buildWhere(query, typedCriteria)

    return helpers.runQuery(this.ctx, query)
  }

  updateOrCreate (criteria, data, options = {}) {
    return this.find(criteria, options).then(found => {
      if (!found || !found.length) {
        return this.create({ ...criteria, ...data }, options)
      } else {
        return this.update(criteria, data, options)
      }
    })
  }

  get (column, criteria, defaultValue) {
    return this.findOne(criteria)
      .then(data => {
        if (!data) return defaultValue
        if (typeof data[column] === 'undefined') {
          return defaultValue
        }

        return data[column]
      })
  }

  set (column, criteria, value) {
    if (!this.schema[column]) {
      throw new Error(
        `no column by the name '${column}' is defined in '${this.name}'`
      )
    }

    return this.update(criteria, {
      [column]: value
    })
  }

  incr (column, criteria, amount) {
    const cast = Number(amount)
    if (Number.isNaN(cast)) amount = 1
    if (amount === 0) return Promise.resolve(0)

    let query = this.ctx.knex(this.name).increment(column, amount)
    query = helpers.buildWhere(query, criteria)

    return helpers.runQuery(this.ctx, query)
  }

  decr (column, criteria, amount, allowNegative) {
    const cast = Number(amount)
    if (Number.isNaN(cast)) amount = 1
    if (amount === 0) return Promise.resolve(0)

    let query = this.ctx.knex(this.name)
    const raw = allowNegative
      ? `${column} - ${amount}`
      : `MAX(0, ${column} - ${amount})`
    query = query.update({ [column]: this.ctx.knex.raw(raw) })
    query = helpers.buildWhere(query, criteria)

    return helpers.runQuery(this.ctx, query)
  }

  remove (criteria) {
    if (!helpers.isValidWhere(criteria)) {
      return Promise.resolve(0)
    }

    if (isObject(criteria) && !Object.keys(criteria).length) {
      return Promise.resolve(0)
    }

    let query = this.ctx.knex(this.name).del()
    query = helpers.buildWhere(query, criteria)

    return helpers.runQuery(this.ctx, query)
  }

  clear () {
    const query = this.ctx.knex(this.name).truncate()
    return helpers.runQuery(this.ctx, query)
  }

  count (column, criteria, options = {}) {
    if (!isString(column)) {
      options = criteria
      criteria = column
      column = '*'
    }

    options = enforcers.aggregateOptions(options)

    const val = `${column} as count`
    const method = options.distinct ? 'countDistinct' : 'count'
    let query = this.ctx.knex(this.name)[method](val)
    query = helpers.buildWhere(query, criteria)

    if (options.group) query = query.groupBy(...options.group)

    return helpers.runQuery(this.ctx, query, true).then(res => {
      if (!isArray(res)) return
      return res[0].count
    })
  }

  min (column, criteria, options = {}) {
    options = enforcers.aggregateOptions(options)

    const val = `${column} as min`
    let query = this.ctx.knex(this.name).min(val)
    query = helpers.buildWhere(query, criteria)

    if (options.group) query = query.groupBy(...options.group)

    return helpers.runQuery(this.ctx, query, true).then(res => {
      if (!isArray(res)) return
      return res[0].min
    })
  }

  max (column, criteria, options) {
    options = enforcers.aggregateOptions(options)

    const val = `${column} as max`
    let query = this.ctx.knex(this.name).max(val)
    query = helpers.buildWhere(query, criteria)

    if (options.group) query = query.groupBy(...options.group)

    return helpers.runQuery(this.ctx, query, true).then(res => {
      if (!isArray(res)) return
      return res[0].max
    })
  }
}
