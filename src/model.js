import * as types from './types'
import * as helpers from './helpers'
import * as enforcers from './enforcers'
import { isArray, isString } from './util'

export default class Model {
  constructor (ctx, name, schema, options) {
    Object.assign(this, {
      ctx, name, schema, options
    })
  }

  create (object, options) {
    let insertion = types.toDefinition(this, object)

    let query = this.ctx.knex.raw(
      this.ctx.knex(this.name)
        .insert(insertion)
        .toString()
        .replace(/^insert/i, 'INSERT OR IGNORE')
    )

    return helpers.runQuery(this.ctx, query)
      .then(() => this.findOne(object))
  }

  find (column, criteria, options = {}) {
    if (!isString(column)) {
      options = criteria
      criteria = column
      column = ''
    }

    options = enforcers.findOptions(options)

    let order = options.random ? 'random' : options.order
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
    if (!isString(column)) {
      options = criteria
      criteria = column
      column = ''
    }

    options = enforcers.findOptions(options)

    let order = options.random ? 'random' : options.order
    let query = this.ctx.knex(this.name).first()
    query = helpers.buildWhere(query, criteria)

    if (order) query = helpers.buildOrder(query, order)
    if (options.skip) query = query.offset(options.skip)

    return helpers.runQuery(this.ctx, query, true).then(response => {
      let result = isArray(response) ? response[0] : response

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
    let query = this.ctx.knex(this.name).update(data)
    query = helpers.buildWhere(query, criteria)

    return helpers.runQuery(this.ctx, query)
  }

  updateOrCreate (criteria, data, options) {
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
      throw new Error('no such column in schema')
    }

    return this.update(criteria, {
      [column]: value
    })
  }

  incr (column, criteria, amount) {
    amount = Number(amount) || 1
    let query = this.ctx.knex(this.name).increment(column, amount)
    query = helpers.buildWhere(query, criteria)

    return helpers.runQuery(this.ctx, query)
  }

  decr (column, criteria, amount, allowNegative) {
    amount = Number(amount) || 1
    let query = this.ctx.knex(this.name)
    let raw = allowNegative
      ? `${column} - ${amount}`
      : `MAX(0, ${column} - ${amount})`
    query = query.update({ [column]: this.ctx.knex.raw(raw) })
    query = helpers.buildWhere(query, criteria)

    return helpers.runQuery(this.ctx, query)
  }

  remove (criteria) {
    let query = this.ctx.knex(this.name).del()
    query = helpers.buildWhere(query, criteria)

    return helpers.runQuery(this.ctx, query)
  }

  count (column, criteria, options = {}) {
    if (!isString(column)) {
      options = criteria
      criteria = column
      column = '*'
    }

    options = enforcers.aggregateOptions(options)

    let val = `${column} as count`
    let method = options.distinct ? 'countDistinct' : 'count'
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

    let val = `${column} as min`
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

    let val = `${column} as max`
    let query = this.ctx.knex(this.name).max(val)
    query = helpers.buildWhere(query, criteria)

    if (options.group) query = query.groupBy(...options.group)

    return helpers.runQuery(this.ctx, query, true).then(res => {
      if (!isArray(res)) return
      return res[0].max
    })
  }
}
