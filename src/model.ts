import { Trilogy } from '.'
import * as helpers from './helpers'
import { Cast, normalizeSchema } from './schema-helpers'
import { invariant, isString, isObject, isNil, toArray, defaultTo } from './util'

import * as types from './types'

export const MODEL_FLAG = Symbol('trilogy-model')

export type ModelParams <D extends types.ReturnDict = types.LooseObject> =
  [Trilogy, string, types.SchemaRaw<D>, types.ModelOptions?]

export default class Model <D extends types.ReturnDict = types.LooseObject> {
  cast: Cast<D>
  schema: types.Schema<D>

  constructor (
    public ctx: Trilogy,
    public name: string,
    schema: types.SchemaRaw<D>,
    public options: types.ModelOptions
  ) {
    this.schema = normalizeSchema<D>(schema)
    this.cast = new Cast<D>(this)
  }

  static get [MODEL_FLAG] () {
    return true
  }

  static [Symbol.hasInstance] (object: any) {
    return object[MODEL_FLAG] === true
  }

  create (
    object: D,
    options: types.LooseObject = {}
  ): Promise<D | undefined> {
    const insertion = this.cast.toDefinition(object, options)

    const query = this.ctx.knex.raw(
      this.ctx.knex(this.name)
        .insert(insertion)
        .toString()
        .replace(/^insert/i, 'INSERT OR IGNORE')
    )

    return helpers.runQuery(this.ctx, query)
      .then(() => helpers.findLastObject<D>(this, object))
      .then(res => {
        if (res) return res
        return res == null ? undefined : this.findOne(object)
      })
  }

  async find (
    criteria?: types.Criteria<D>,
    options: types.FindOptions = {}
  ): Promise<D[]> {
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
      return this.cast.fromDefinition(object, options)
    })
  }

  async findIn (
    column: keyof D,
    criteria?: types.Criteria<D>,
    options?: types.FindOptions
  ): Promise<types.ValueOf<D>[]> {
    const response = await this.find(criteria, options)
    return response.map(object => {
      return this.cast.fromColumnDefinition(
        column as string,
        object[column],
        options
      )
    })
  }

  async findOne (
    criteria?: types.Criteria<D>,
    options: types.FindOptions = {}
  ): Promise<D | undefined> {
    options = types.validate(options, types.FindOptions)

    const order = options.random ? 'random' : options.order
    let query = this.ctx.knex(this.name).first()
    query = helpers.buildWhere(query, criteria)

    if (order) query = helpers.buildOrder(query, order)
    if (options.skip) query = query.offset(options.skip)

    const response = await helpers.runQuery(this.ctx, query, true)
    const result: D = Array.isArray(response) ? response[0] : response
    if (isNil(result)) return undefined

    return this.cast.fromDefinition(result, options)
  }

  async findOneIn <K extends keyof D = keyof D, V = D[K]> (
    column: K,
    criteria?: types.Criteria<D>,
    options: types.FindOptions = {}
  ): Promise<V | undefined> {
    return this.findOne(criteria, options)
      .then(object => object != null ? object[column] as V : undefined)
  }

  async findOrCreate (
    criteria: types.CriteriaObj<D>,
    creation: Partial<D> = {},
    options?: types.FindOptions
  ): Promise<D | undefined> {
    const existing = await this.findOne(criteria, options)
    // must cast `criteria` & `creation` to any as a workaround
    // for not being able to spread a generic type, see:
    // https://github.com/Microsoft/TypeScript/issues/10727
    return existing || this.create({ ...(criteria as any), ...(creation as any) })
  }

  update (
    criteria: types.Criteria<D> = {},
    data: Partial<D> = {},
    options: types.UpdateOptions = {}
  ): Promise<number> {
    options = types.validate(options, types.UpdateOptions)

    if (Object.keys(data).length < 1) return Promise.resolve(0)

    const typedData = this.cast.toDefinition(data, options)
    const typedCriteria = this.cast.toDefinition(criteria, options)

    let query = this.ctx.knex(this.name).update(typedData)
    query = helpers.buildWhere(query, typedCriteria)

    return helpers.runQuery(this.ctx, query)
  }

  async updateOrCreate (
    criteria: types.CriteriaObj<D>,
    data: Partial<D>,
    options: types.UpdateOptions & types.CreateOptions = {}
  ): Promise<number> {
    const found = await this.find(criteria, options)

    if (!found || !found.length) {
      return this.create({ ...(criteria as any), ...(data as any) }, options)
        .then(res => Number(!!res))
    } else {
      return this.update(criteria, data, options)
    }
  }

  get <K extends keyof D = keyof D, V extends D[K] = D[K]> (
    column: K, criteria?: types.Criteria<D>, defaultValue?: V
  ) {
    return baseGet<D, K>(this, column, criteria, defaultValue)
  }

  set <K extends keyof D = keyof D, V extends D[K] = D[K]> (
    column: K, criteria?: types.Criteria<D>, value?: V
  ) {
    return baseSet<D, K>(this, column, criteria, value)
  }

  getRaw <K extends keyof D = keyof D, V extends D[K] = D[K]> (
    column: K, criteria: types.Criteria<D>, defaultValue?: V
  ) {
    return baseGet<D, K>(this, column, criteria, defaultValue, { raw: true })
  }

  setRaw <K extends keyof D = keyof D, V extends D[K] = D[K]> (
    column: K, criteria?: types.Criteria<D>, value?: V
  ) {
    return baseSet<D, K>(this, column, criteria, value, { raw: true })
  }

  async incr (
    column: keyof D,
    criteria?: types.Criteria<D>,
    amount?: number
  ): Promise<number> {
    const cast = Number(amount)
    if (Number.isNaN(cast)) amount = 1
    if (amount === 0) return 0

    let query = this.ctx.knex(this.name).increment(column as string, amount)
    query = helpers.buildWhere(query, criteria)

    return helpers.runQuery(this.ctx, query)
  }

  async decr (
    column: keyof D,
    criteria?: types.Criteria<D>,
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

  async remove (criteria: types.Criteria<D>): Promise<number> {
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
    criteria?: types.Criteria<D>,
    options: types.AggregateOptions = {}
  ): Promise<number> {
    return baseCount<D>(this, '*', criteria, options)
  }

  async countIn (
    column: keyof D,
    criteria?: types.Criteria<D>,
    options: types.AggregateOptions = {}
  ): Promise<number> {
    return baseCount<D>(this, column, criteria, options)
  }

  async min (
    column: keyof D,
    criteria?: types.Criteria<D>,
    options: types.AggregateOptions = {}
  ): Promise<number | undefined> {
    return baseMinMax(this, 'min', column, criteria, options)
  }

  async max (
    column: keyof D,
    criteria?: types.Criteria<D>,
    options?: types.AggregateOptions
  ): Promise<number | undefined> {
    return baseMinMax(this, 'max', column, criteria, options)
  }
}

async function baseCount <D extends types.ReturnDict> (
  model: Model<D>,
  column: keyof D,
  criteria?: types.Criteria<D>,
  options: types.AggregateOptions = {}
): Promise<number> {
  invariant(
    column && isString(column),
    `invalid column: expected string, got ${typeof column}`
  )

  options = types.validate(options, types.AggregateOptions)

  const val = `${column} as count`
  const method = options.distinct ? 'countDistinct' : 'count'
  let query = model.ctx.knex(model.name)[method](val)
  query = helpers.buildWhere(query, criteria)

  if (options.group) query = query.groupBy(toArray(options.group))

  const res = await helpers.runQuery(model.ctx, query, true)
  if (!Array.isArray(res)) return 0
  return res[0].count
}

async function baseMinMax <D extends types.ReturnDict> (
  model: Model<D>,
  method: 'min' | 'max',
  column: keyof D,
  criteria?: types.Criteria<D>,
  options: types.AggregateOptions = {}
) {
  options = types.validate(options, types.AggregateOptions)

  const val = `${column} as ${method}`
  let query = model.ctx.knex(model.name)[method](val)
  query = helpers.buildWhere(query, criteria)

  if (options.group) query = query.groupBy(toArray(options.group))

  const res = await helpers.runQuery(model.ctx, query, true)
  if (!Array.isArray(res)) return undefined
  return res[0][method]
}

async function baseGet <D extends types.ReturnDict, K extends keyof D> (
  model: Model<D>,
  column: K,
  criteria: types.Criteria<D> | undefined,
  defaultValue?: D[K],
  options?: types.LooseObject
): Promise<D[K] | undefined> {
  const data = await model.findOneIn(column, criteria, options)
  return defaultTo(data, defaultValue)
}

async function baseSet <D extends types.ReturnDict, K extends keyof D> (
  model: Model<D>,
  column: K,
  criteria: types.Criteria<D> | undefined,
  value?: D[K],
  options?: types.LooseObject
): Promise<number> {
  invariant(
    model.schema[column as string],
    `no column by the name '${column}' is defined in '${model.name}'`
  )

  return model.update(criteria, {
    [column]: value
  } as Partial<D>, options)
}
