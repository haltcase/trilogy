import { Trilogy } from '.'
import * as helpers from './helpers'
import { Cast, normalizeSchema } from './schema-helpers'
import { invariant, isString, isObject, isNil } from './util'

import * as types from './types'

const MODEL_FLAG = Symbol('trilogy-model')

export default class Model {
  cast: Cast
  schema: types.Schema

  constructor (
    public ctx: Trilogy,
    public name: string,
    schema: types.SchemaRaw,
    public options: {}
  ) {
    this.schema = normalizeSchema(schema)
    this.cast = new Cast(this)
  }

  static get [MODEL_FLAG] () {
    return true
  }

  static [Symbol.hasInstance] (object) {
    return object[MODEL_FLAG] === true
  }

  create (
    object: types.ObjectLiteral,
    options: types.ObjectLiteral = {}
  ): Promise<object> {
    const insertion = this.cast.toDefinition(object, options)

    const query = this.ctx.knex.raw(
      this.ctx.knex(this.name)
        .insert(insertion)
        .toString()
        .replace(/^insert/i, 'INSERT OR IGNORE')
    )

    return helpers.runQuery(this.ctx, query)
      .then(() => helpers.findLastObject(this, object))
      .then(res => res || (res != null && this.findOne(object)))
  }

  async find (
    column: string,
    criteria: types.Criteria,
    options?: types.FindOptions
  ): Promise<any[]>
  async find (
    criteria?: types.Criteria,
    options?: types.FindOptions
  ): Promise<any[]>
  async find (
    column: string | types.Criteria,
    criteria?: types.Criteria,
    options: types.FindOptions = {}
  ): Promise<any[]> {
    if (column && !isString(column)) {
      options = criteria || {}
      criteria = column
      column = ''
    }

    options = types.validate(options, types.FindOptions)

    const order = options.random ? 'random' : options.order
    let query = this.ctx.knex(this.name).select()
    query = helpers.buildWhere(query, criteria)

    if (order) query = helpers.buildOrder(query, order)
    if (options.limit) query = query.limit(options.limit)
    if (options.skip) query = query.offset(options.skip)

    const response = await helpers.runQuery(this.ctx, query, true)
    if (!Array.isArray(response)) {
      return response ? [response] : []
    }

    return response.map(object => {
      if (!column) {
        return this.cast.fromDefinition(object, options)
      } else {
        return this.cast.fromColumnDefinition(
          column as string,
          object[column as string],
          options
        )
      }
    })
  }

  async findOne (
    column: string,
    criteria: types.Criteria,
    options?: types.FindOptions
  ): Promise<any>
  async findOne (
    criteria?: types.Criteria,
    options?: types.FindOptions
  ): Promise<any>
  async findOne (
    column?: string | types.Criteria,
    criteria?: types.Criteria,
    options: types.FindOptions = {}
  ): Promise<any> {
    if (column && !isString(column)) {
      options = criteria || {}
      criteria = column
      column = ''
    }

    options = types.validate(options, types.FindOptions)

    const order = options.random ? 'random' : options.order
    let query = this.ctx.knex(this.name).first()
    query = helpers.buildWhere(query, criteria)

    if (order) query = helpers.buildOrder(query, order)
    if (options.skip) query = query.offset(options.skip)

    const response = await helpers.runQuery(this.ctx, query, true)
    const result = Array.isArray(response) ? response[0] : response
    if (isNil(result)) return result

    if (!column) {
      return this.cast.fromDefinition(result, options)
    } else {
      // if a column was provided, skip casting
      // the entire object and just process then
      // return that particular property
      return this.cast.fromColumnDefinition(
        column as string,
        result[column as string],
        options
      )
    }
  }

  async findOrCreate (
    criteria: types.Criteria,
    creation: types.ObjectLiteral,
    options?: types.FindOptions
  ): Promise<types.ObjectLiteral> {
    const existing = await this.findOne(criteria, options)
    return existing || this.create({ ...criteria, ...creation })
  }

  update (
    criteria: types.Criteria,
    data: types.ObjectLiteral,
    options: types.UpdateOptions = {}
  ): Promise<number> {
    options = types.validate(options, types.UpdateOptions)

    const typedData = this.cast.toDefinition(data, options)
    const typedCriteria = this.cast.toDefinition(criteria, options)

    let query = this.ctx.knex(this.name).update(typedData)
    query = helpers.buildWhere(query, typedCriteria)

    return helpers.runQuery(this.ctx, query)
  }

  async updateOrCreate (
    criteria: types.CriteriaObj,
    data: types.ObjectLiteral,
    options: types.UpdateOptions & types.CreateOptions = {}
  ): Promise<number> {
    const found = await this.find(criteria, options)

    if (!found || !found.length) {
      return this.create({ ...criteria, ...data }, options)
        .then(res => Number(!!res))
    } else {
      return this.update(criteria, data, options)
    }
  }

  get <T> (column: string, criteria?: types.Criteria, defaultValue?: T) {
    return baseGet(this, column, criteria, defaultValue)
  }

  set <T> (column: string, criteria?: types.Criteria, value?: T) {
    return baseSet(this, column, criteria, value)
  }

  getRaw <T> (column: string, criteria: types.Criteria, defaultValue?: T) {
    return baseGet(this, column, criteria, defaultValue, { raw: true })
  }

  setRaw <T> (column: string, criteria?: types.Criteria, value?: T) {
    return baseSet(this, column, criteria, value, { raw: true })
  }

  async incr (
    column?: string,
    criteria?: types.Criteria,
    amount?: number
  ): Promise<number> {
    const cast = Number(amount)
    if (Number.isNaN(cast)) amount = 1
    if (amount === 0) return 0

    let query = this.ctx.knex(this.name).increment(column, amount)
    query = helpers.buildWhere(query, criteria)

    return helpers.runQuery(this.ctx, query)
  }

  async decr (
    column?: string,
    criteria?: types.Criteria,
    amount?: number,
    allowNegative?: boolean
  ): Promise<number> {
    const cast = Number(amount)
    if (Number.isNaN(cast)) amount = 1
    if (amount === 0) return 0

    let query = this.ctx.knex(this.name)
    const raw = allowNegative
      ? `${column} - ${amount}`
      : `MAX(0, ${column} - ${amount})`
    query = query.update({ [column]: this.ctx.knex.raw(raw) })
    query = helpers.buildWhere(query, criteria)

    return helpers.runQuery(this.ctx, query)
  }

  async remove (criteria: types.Criteria): Promise<number> {
    if (
      !helpers.isValidWhere(criteria) ||
      (isObject(criteria) && !Object.keys(criteria).length)
    ) return 0

    let query = this.ctx.knex(this.name).del()
    query = helpers.buildWhere(query, criteria)

    return helpers.runQuery(this.ctx, query)
  }

  clear (): Promise<number> {
    const query = this.ctx.knex(this.name).truncate()
    return helpers.runQuery(this.ctx, query)
  }

  async count (
    column: string,
    criteria: types.Criteria,
    options?: types.AggregateOptions
  ): Promise<number>
  async count (
    criteria: types.Criteria,
    options?: types.AggregateOptions
  ): Promise<number>
  async count (
    column?: string | types.Criteria,
    criteria?: types.Criteria,
    options: types.AggregateOptions = {}
  ): Promise<number> {
    if (!isString(column)) {
      options = criteria || {}
      criteria = column
      column = '*'
    }

    options = types.validate(options, types.AggregateOptions)

    const val = `${column} as count`
    const method = options.distinct ? 'countDistinct' : 'count'
    let query = this.ctx.knex(this.name)[method](val)
    query = helpers.buildWhere(query, criteria)

    if (options.group) query = query.groupBy(...options.group)

    const res = await helpers.runQuery(this.ctx, query, true)
    if (!Array.isArray(res)) return 0
    return res[0].count
  }

  async min (
    column: string,
    criteria?: types.Criteria,
    options: types.AggregateOptions = {}
  ): Promise<number | void> {
    options = types.validate(options, types.AggregateOptions)

    const val = `${column} as min`
    let query = this.ctx.knex(this.name).min(val)
    query = helpers.buildWhere(query, criteria)

    if (options.group) query = query.groupBy(...options.group)

    const res = await helpers.runQuery(this.ctx, query, true)
    if (!Array.isArray(res)) return undefined
    return res[0].min
  }

  async max (
    column: string,
    criteria?: types.Criteria,
    options?: types.AggregateOptions
  ): Promise<number | void> {
    options = types.validate(options, types.AggregateOptions)

    const val = `${column} as max`
    let query = this.ctx.knex(this.name).max(val)
    query = helpers.buildWhere(query, criteria)

    if (options.group) query = query.groupBy(...options.group)

    const res = await helpers.runQuery(this.ctx, query, true)
    if (!Array.isArray(res)) return undefined
    return res[0].max
  }
}

async function baseGet <T> (
  model: Model,
  column: string,
  criteria: types.Criteria,
  defaultValue: T,
  options?: types.ObjectLiteral
): Promise<T> {
  const data = await model.findOne(criteria, options)
  if (!data || data[column] === undefined) {
    return defaultValue
  }

  return data[column]
}

async function baseSet (
  model: Model,
  column: string,
  criteria: types.Criteria,
  value,
  options?: types.ObjectLiteral
) {
  invariant(
    model.schema[column],
    `no column by the name '${column}' is defined in '${model.name}'`
  )

  return model.update(criteria, {
    [column]: value
  }, options)
}
