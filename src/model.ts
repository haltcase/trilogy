import { Trilogy } from '.'
import { Hooks, Hook } from './hooks'

import * as helpers from './helpers'
import {
  Cast, normalizeSchema, createTrigger, TriggerEvent
} from './schema-helpers'
import {
  invariant, isEmpty, isString, isObject, isNil, toArray, defaultTo, firstOrValue
} from './util'

import * as types from './types'

export default class Model <
  D extends types.ReturnDict = types.LooseObject
> extends Hooks<D> {
  cast: Cast<D>
  schema: types.Schema<D>

  constructor (
    public ctx: Trilogy,
    public name: string,
    schema: types.SchemaRaw<D>,
    public options: types.ModelOptions
  ) {
    super()
    this.schema = normalizeSchema<D>(schema, options)
    this.cast = new Cast<D>(this)
  }

  async create (
    object: D,
    options: types.CreateOptions = {}
  ): Promise<D | undefined> {
    await this._callHook(Hook.BeforeCreate, object, options)
    const insertion = this.cast.toDefinition(object, options)

    const [returning, cleanup] =
      await createTrigger(this, TriggerEvent.Insert)

    const query = this.ctx.knex.raw(
      this.ctx.knex(this.name)
        .insert(insertion)
        .toString()
        .replace(/^insert/i, 'INSERT OR IGNORE')
    )

    await helpers.runQuery(this.ctx, query, { model: this })
    const result = await helpers.runQuery(this.ctx, returning, {
      model: this,
      needResponse: true
    })
    await cleanup()

    const created = !isEmpty(result)
      ? this.cast.fromDefinition(
          firstOrValue(result),
          options
        )
      : undefined

    await this._callHook(Hook.AfterCreate, created, options)
    return created
  }

  async find (
    criteria?: types.Criteria<D>,
    options: types.FindOptions = {}
  ): Promise<D[]> {
    options = types.validate(options, types.FindOptions)

    const order = options.random ? 'random' : options.order
    let query = this.ctx.knex(this.name).select()
    query = helpers.buildWhere(query, this.cast.toDefinition(
      criteria || {},
      { raw: true, ...options }
    ))

    if (order) query = helpers.buildOrder(query, order)
    if (options.limit) query = query.limit(options.limit)
    if (options.skip) query = query.offset(options.skip)

    const response = await helpers.runQuery(this.ctx, query, {
      model: this,
      needResponse: true
    })

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
    query = helpers.buildWhere(query, this.cast.toDefinition(
      criteria || {},
      { raw: true, ...options }
    ))

    if (order) query = helpers.buildOrder(query, order)
    if (options.skip) query = query.offset(options.skip)

    const response = await helpers.runQuery(this.ctx, query, {
      model: this,
      needResponse: true
    })

    const result = firstOrValue<D>(response)
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
    return (
      await this.findOne(criteria, options) ||
      this.create({ ...criteria, ...creation } as D)
    )
  }

  async update (
    criteria: types.Criteria<D> = {},
    data: Partial<D> = {},
    options: types.UpdateOptions = {}
  ): Promise<D[]> {
    options = types.validate(options, types.UpdateOptions)

    if (Object.keys(data).length < 1) return []

    const [returning, cleanup] = await createTrigger(this, TriggerEvent.Update)

    await this._callHook(Hook.BeforeUpdate, [data, criteria], options)
    const typedData = this.cast.toDefinition(data, options)
    const typedCriteria = this.cast.toDefinition(criteria, options)

    let query = this.ctx.knex(this.name).update(typedData)
    query = helpers.buildWhere(query, typedCriteria)

    await helpers.runQuery(this.ctx, query, { model: this })
    const updatedRaw: D[] = await helpers.runQuery(this.ctx, returning, {
      model: this,
      needResponse: true
    })

    const updated = updatedRaw.map(object => {
      return this.cast.fromDefinition(object, options)
    })

    await cleanup()
    await this._callHook(Hook.AfterUpdate, updated, options)
    return updated
  }

  async updateOrCreate (
    criteria: types.CriteriaObj<D>,
    data: Partial<D>,
    options: types.UpdateOptions & types.CreateOptions = {}
  ): Promise<D[]> {
    const found = await this.find(criteria, options)

    if (!found || !found.length) {
      return this.create({ ...criteria, ...data } as D, options)
        .then(res => toArray<D>(res as D))
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
    column: K, criteria: types.Criteria<D>, value: V
  ) {
    return baseSet<D, K>(this, column, criteria, value)
  }

  getRaw <K extends keyof D = keyof D, V extends D[K] = D[K]> (
    column: K, criteria: types.Criteria<D>, defaultValue?: V
  ) {
    return baseGet<D, K>(this, column, criteria, defaultValue, { raw: true })
  }

  setRaw <K extends keyof D = keyof D, V extends D[K] = D[K]> (
    column: K, criteria: types.Criteria<D>, value: V
  ) {
    return baseSet<D, K>(this, column, criteria, value, { raw: true })
  }

  async increment (
    column: keyof D,
    criteria?: types.Criteria<D>,
    amount?: number
  ): Promise<D[]> {
    await this._callHook(Hook.BeforeUpdate, [{}, criteria] as [Partial<D>, types.Criteria<D>])

    const cast = Number(amount)
    if (Number.isNaN(cast)) amount = 1
    if (amount === 0) return []

    const [returning, cleanup] = await createTrigger(this, TriggerEvent.Update)

    let query = this.ctx.knex(this.name).increment(column as string, amount)
    query = helpers.buildWhere(query, criteria)

    const affected = await helpers.runQuery(this.ctx, query, { model: this })
    if (affected === 0) return []

    const updatedRaw: D[] = await helpers.runQuery(this.ctx, returning, {
      model: this,
      needResponse: true
    })

    const updated = updatedRaw.map(object => {
      return this.cast.fromDefinition(object, {})
    })

    await cleanup()
    await this._callHook(Hook.AfterUpdate, updated)
    return updated
  }

  async decrement (
    column: keyof D,
    criteria?: types.Criteria<D>,
    amount?: number,
    allowNegative?: boolean
  ): Promise<D[]> {
    await this._callHook(Hook.BeforeUpdate, [{}, criteria] as [Partial<D>, types.Criteria<D>])

    const cast = Number(amount)
    if (Number.isNaN(cast)) amount = 1
    if (amount === 0) return []

    const [returning, cleanup] = await createTrigger(this, TriggerEvent.Update)

    let query = this.ctx.knex(this.name)
    const raw = allowNegative
      ? `${column} - ${amount}`
      : `MAX(0, ${column} - ${amount})`
    query = query.update({ [column]: this.ctx.knex.raw(raw) })
    query = helpers.buildWhere(query, criteria)

    const affected = await helpers.runQuery(this.ctx, query, { model: this })
    if (affected === 0) return []

    const updatedRaw: D[] = await helpers.runQuery(this.ctx, returning, {
      model: this,
      needResponse: true
    })

    const updated = updatedRaw.map(object => {
      return this.cast.fromDefinition(object, {})
    })

    await cleanup()
    await this._callHook(Hook.AfterUpdate, updated)
    return updated
  }

  async remove (criteria: types.Criteria<D>): Promise<D[]> {
    await this._callHook(Hook.BeforeRemove, criteria)

    if (
      !helpers.isValidWhere(criteria) ||
      (isObject(criteria) && !Object.keys(criteria).length)
    ) return []

    const [returning, cleanup] = await createTrigger(this, TriggerEvent.Delete)

    let query = this.ctx.knex(this.name).del()
    query = helpers.buildWhere(query, criteria)

    const deleteCount = await helpers.runQuery(this.ctx, query)
    if (deleteCount === 0) return []

    const deleted = await helpers.runQuery(this.ctx, returning, {
      model: this,
      needResponse: true
    })

    await cleanup()
    await this._callHook(Hook.AfterRemove, deleted)
    return deleted
  }

  // TODO?: make this return `D[]` like `remove()`
  clear (): Promise<number> {
    const query = this.ctx.knex(this.name).truncate()
    return helpers.runQuery(this.ctx, query, { model: this })
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
  const builder = model.ctx.knex(model.name)
  let query = options.distinct ? builder.countDistinct(val) : builder.count(val)
  query = helpers.buildWhere(query, model.cast.toDefinition(
    criteria || {},
    { raw: true, ...options }
  ))

  if (options.group) query = query.groupBy(toArray(options.group))

  const res = await helpers.runQuery(model.ctx, query, { model, needResponse: true })
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
  query = helpers.buildWhere(query, model.cast.toDefinition(
    criteria || {},
    { raw: true, ...options }
  ))

  if (options.group) query = query.groupBy(toArray(options.group))

  const res = await helpers.runQuery(model.ctx, query, { model, needResponse: true })
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
): Promise<D[]> {
  invariant(
    model.schema[column as string],
    `no column by the name '${column}' is defined in '${model.name}'`
  )

  return model.update(criteria, {
    [column]: value
  } as Partial<D>, options)
}
