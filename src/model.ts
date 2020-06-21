import { Trilogy } from '.'
import { Hooks, Hook } from './hooks'

import * as helpers from './helpers'
import {
  Cast, normalizeSchema, createTrigger, TriggerEvent
} from './schema-helpers'
import {
  invariant, isEmpty, isString, isObject, isNil, toArray, firstOrValue
} from './util'

import * as types from './types'

const baseCount = async <D extends types.ReturnDict> (
  model: Model<D>,
  column: keyof D,
  criteria?: types.Criteria<D>,
  options: types.AggregateOptions = {}
): Promise<number> => {
  invariant(
    column && isString(column),
    `invalid column: expected string, got ${typeof column}`
  )

  types.AggregateOptions.check(options)

  const val = `${column} as count`
  const builder = model.ctx.knex(model.name)
  let query = options.distinct ? builder.countDistinct(val) : builder.count(val)
  query = helpers.buildWhere(query, model.cast.toDefinition(
    criteria || {},
    { raw: true, ...options }
  ))

  if (options.group) query = query.groupBy(toArray(options.group))

  const res = await helpers.runQuery(model.ctx, query, {
    model,
    needResponse: true
  })
  if (!Array.isArray(res)) return 0
  return res[0].count
}

const baseMinMax = async <D extends types.ReturnDict> (
  model: Model<D>,
  method: 'min' | 'max',
  column: keyof D,
  criteria?: types.Criteria<D>,
  options: types.AggregateOptions = {}
) => {
  types.AggregateOptions.check(options)

  const val = `${column} as ${method}`
  let query = model.ctx.knex(model.name)[method](val)
  query = helpers.buildWhere(query, model.cast.toDefinition(
    criteria || {},
    { raw: true, ...options }
  ))

  if (options.group) query = query.groupBy(toArray(options.group))

  const res = await helpers.runQuery(model.ctx, query, {
    model,
    needResponse: true
  })
  if (!Array.isArray(res)) return undefined
  return res[0][method]
}

const baseGet = async <D extends types.ReturnDict, K extends keyof D> (
  model: Model<D>,
  column: K,
  criteria: types.Criteria<D> | undefined,
  defaultValue?: D[K],
  options?: types.LooseObject
): Promise<D[K] | undefined> => {
  const data = await model.findOneIn(column, criteria, options)
  return data ?? defaultValue
}

const baseSet = async <D extends types.ReturnDict, K extends keyof D> (
  model: Model<D>,
  column: K,
  criteria: types.Criteria<D> | undefined,
  value?: D[K],
  options?: types.LooseObject
): Promise<D[]> => {
  invariant(
    model.schema[column as string],
    `no column by the name '${column}' is defined in '${model.name}'`
  )

  return await model.update(criteria, {
    [column]: value
  } as Partial<D>, options)
}

/**
 * Instances of `Model` manage the casting of values back and forth between the
 * SQLite backend and their corresponding JavaScript types as well as calling
 * hooks.
 *
 * Models are created using a trilogy instance's `model` method and are not
 * intended to be created directly.
 *
 * @internal
 */
export default class Model <
  D extends types.ReturnDict = types.LooseObject
> extends Hooks<D> {
  cast: Cast<D>
  schema: types.Schema<D>

  /**
   * @param ctx trilogy instance used as a context for the model
   * @param name Name associated with this model and used in the backend
   * @param schema An object defining the fields & types of objects
   * @param options
   */
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

  /**
   * Create an object on the given model. `object` should match the model's
   * defined schema but values will cast into types as needed.
   *
   * @param object Data to insert
   * @param options
   */
  async create (
    object: D,
    options: types.CreateOptions = {}
  ): Promise<D | undefined> {
    const { prevented } =
      await this._callHook(Hook.BeforeCreate, object, options)

    if (prevented) return

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
      needResponse: true,
      internal: true
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

  /**
   * Find all objects matching a given criteria.
   *
   * @param criteria Criteria used to restrict selection
   * @param options
   */
  async find (
    criteria?: types.Criteria<D>,
    options: types.FindOptions = {}
  ): Promise<D[]> {
    types.FindOptions.check(options)

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

  /**
   * Find all objects matching a given criteria and extract the values
   * at `column`.
   *
   * @param column Property name of objects to extract the value from
   * @param criteria Criteria used to restrict selection
   * @param options
   */
  async findIn (
    column: keyof D,
    criteria?: types.Criteria<D>,
    options?: types.FindOptions
  ): Promise<Array<types.ValueOf<D>>> {
    const response = await this.find(criteria, options)
    return response.map(object => {
      return this.cast.fromColumnDefinition(
        column as string,
        object[column],
        options
      )
    })
  }

  /**
   * Find a single object matching a given criteria. The first matching
   * object is returned.
   *
   * @param criteria Criteria used to restrict selection
   * @param options
   */
  async findOne (
    criteria?: types.Criteria<D>,
    options: types.FindOptions = {}
  ): Promise<D | undefined> {
    types.FindOptions.check(options)

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

  /**
   * Find a single object matching a given criteria and extract the value
   * at `column`. The first matching object is returned.
   *
   * @param column Property name of the selected object to extract the value from
   * @param criteria Criteria used to restrict selection
   * @param options
   */
  async findOneIn <K extends keyof D = keyof D, V = D[K]> (
    column: K,
    criteria?: types.Criteria<D>,
    options: types.FindOptions = {}
  ): Promise<V | undefined> {
    return this.findOne(criteria, options)
      .then(object => object != null ? object[column] as V : undefined)
  }

  /**
   * Find a matching object based on the given criteria, or create it if it
   * doesn't exist. When creating the object, a merged object created from
   * `criteria` and `creation` will be used, with the properties from
   * `creation` taking precedence.
   *
   * @param criteria Criteria to search for
   * @param creation Data used to create the object if it doesn't exist
   * @param options
   */
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

  /**
   * Modify the properties of an existing object. While optional, if `data`
   * contains no properties no update queries will be run.
   *
   * @param criteria Criteria used to restrict selection
   * @param data Updates to be made on matching objects
   * @param options
   */
  async update (
    criteria: types.Criteria<D> = {},
    data: Partial<D> = {},
    options: types.UpdateOptions = {}
  ): Promise<D[]> {
    types.UpdateOptions.check(options)

    if (Object.keys(data).length < 1) return []

    const [returning, cleanup] =
      await createTrigger(this, TriggerEvent.Update)

    const { prevented } =
      await this._callHook(Hook.BeforeUpdate, [data, criteria], options)

    if (prevented) return []

    const typedData = this.cast.toDefinition(data, options)
    const typedCriteria = this.cast.toDefinition(criteria, options)

    let query = this.ctx.knex(this.name).update(typedData)
    query = helpers.buildWhere(query, typedCriteria)

    await helpers.runQuery(this.ctx, query, { model: this })

    const updatedRaw: D[] = await helpers.runQuery(this.ctx, returning, {
      model: this,
      needResponse: true,
      internal: true
    })

    const updated = updatedRaw.map(object => {
      return this.cast.fromDefinition(object, options)
    })

    await cleanup()
    await this._callHook(Hook.AfterUpdate, updated, options)
    return updated
  }

  /**
   * Update an existing object or create it if it doesn't exist. If creation
   * is necessary a merged object created from `criteria` and `data` will be
   * used, with the properties from `data` taking precedence.
   *
   * @param criteria Criteria used to restrict selection
   * @param data Updates to be made on matching objects
   * @param options
   */
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

  /**
   * Works similarly to the `get` methods in lodash, underscore, etc. Returns
   * the value at `column` or, if it does not exist, the supplied `defaultValue`.
   * Essentially a useful shorthand for some `find` scenarios.
   *
   * @param column Property name of the object to extract the value from
   * @param criteria Criteria used to restrict selection
   * @param defaultValue Value returned if the result doesn't exist
   */
  async get <K extends keyof D = keyof D, V extends D[K] = D[K]> (
    column: K, criteria?: types.Criteria<D>, defaultValue?: V
  ) {
    return baseGet<D, K>(this, column, criteria, defaultValue)
  }

  /**
   * Works similarly to the `set` methods in lodash, underscore, etc. Updates
   * the value at `column` to be `value` where the given criteria is met.
   *
   * @param column Property name of the object at which to set the value
   * @param criteria Criteria used to restrict selection
   * @param value Value returned if the result doesn't exist
   */
  async set <K extends keyof D = keyof D, V extends D[K] = D[K]> (
    column: K, criteria: types.Criteria<D>, value: V
  ) {
    return baseSet<D, K>(this, column, criteria, value)
  }

  /**
   * Works exactly like `get` but bypasses getters and retrieves the raw database value.
   *
   * @param column Property name of the object to extract the value from
   * @param criteria Criteria used to restrict selection
   * @param defaultValue Value returned if the result doesn't exist
   */
  async getRaw <K extends keyof D = keyof D, V extends D[K] = D[K]> (
    column: K, criteria: types.Criteria<D>, defaultValue?: V
  ) {
    return baseGet<D, K>(this, column, criteria, defaultValue, { raw: true })
  }

  /**
   * Works exactly like `set` but bypasses setters when updating the target value.
   *
   * @param column Property name of the object at which to set the value
   * @param criteria Criteria used to restrict selection
   * @param value Value returned if the result doesn't exist
   */
  async setRaw <K extends keyof D = keyof D, V extends D[K] = D[K]> (
    column: K, criteria: types.Criteria<D>, value: V
  ) {
    return baseSet<D, K>(this, column, criteria, value, { raw: true })
  }

  /**
   * Increment the value of a given model's property by the specified amount,
   * which defaults to `1` if not provided.
   *
   * @param column Property at which to increment the value
   * @param criteria Criteria used to restrict selection
   * @param amount
   */
  async increment (
    column: keyof D,
    criteria?: types.Criteria<D>,
    amount?: number
  ): Promise<D[]> {
    const { prevented } =
      await this._callHook(Hook.BeforeUpdate, [{}, criteria as types.Criteria<D>])

    if (prevented) return []

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
      needResponse: true,
      internal: true
    })

    const updated = updatedRaw.map(object => {
      return this.cast.fromDefinition(object, {})
    })

    await cleanup()
    await this._callHook(Hook.AfterUpdate, updated)
    return updated
  }

  /**
   * Decrement the value of a given model's property by the specified amount,
   * which defaults to `1` if not provided.
   *
   * @param column Property at which to decrement the value
   * @param criteria Criteria used to restrict selection
   * @param amount
   */
  async decrement (
    column: keyof D,
    criteria?: types.Criteria<D>,
    amount?: number,
    allowNegative?: boolean
  ): Promise<D[]> {
    const { prevented } =
      await this._callHook(Hook.BeforeUpdate, [{}, criteria as types.Criteria<D>])

    if (prevented) return []

    const cast = Number(amount)
    if (Number.isNaN(cast)) amount = 1
    if (amount === 0) return []

    const [returning, cleanup] = await createTrigger(this, TriggerEvent.Update)

    const raw = allowNegative ? '?? - ?' : 'MAX(0, ?? - ?)'
    const query = helpers.buildWhere(
      this.ctx.knex(this.name).update({
        [column]: this.ctx.knex.raw(raw, [column, amount] as [string, number])
      }),
      criteria
    )

    const affected = await helpers.runQuery(this.ctx, query, { model: this })
    if (affected === 0) return []

    const updatedRaw: D[] = await helpers.runQuery(this.ctx, returning, {
      model: this,
      needResponse: true,
      internal: true
    })

    const updated = updatedRaw.map(object => {
      return this.cast.fromDefinition(object, {})
    })

    await cleanup()
    await this._callHook(Hook.AfterUpdate, updated)
    return updated
  }

  /**
   * Delete objects from this model that match `criteria`.
   *
   * @remarks
   * If `criteria` is empty or absent, nothing will be done. This is a safeguard
   * against unintentionally deleting everything in the model. Use `clear` if
   * you really want to remove all rows.
   *
   * @param criteria Criteria used to restrict selection
   */
  async remove (criteria: types.Criteria<D>): Promise<D[]> {
    const { prevented } =
      await this._callHook(Hook.BeforeRemove, criteria)

    if (prevented) return []

    if (
      !helpers.isValidWhere(criteria) ||
      (isObject(criteria) && !Object.keys(criteria).length)
    ) return []

    const [returning, cleanup] = await createTrigger(this, TriggerEvent.Delete)

    let query = this.ctx.knex(this.name).del()
    query = helpers.buildWhere(query, criteria)

    const deleteCount = await helpers.runQuery(this.ctx, query, { model: this })

    if (deleteCount === 0) return []

    const deleted = await helpers.runQuery(this.ctx, returning, {
      model: this,
      needResponse: true,
      internal: true
    })

    await cleanup()
    await this._callHook(Hook.AfterRemove, deleted)
    return deleted
  }

  /**
   * Delete all objects from this model.
   */
  async clear (): Promise<number> {
    const query = this.ctx.knex(this.name).truncate()
    return helpers.runQuery(this.ctx, query, { model: this })
  }

  /**
   * Count the number of objects in this model.
   *
   * @param criteria Criteria used to restrict selection
   * @param options
   */
  async count (
    criteria?: types.Criteria<D>,
    options: types.AggregateOptions = {}
  ): Promise<number> {
    return baseCount<D>(this, '*', criteria, options)
  }

  /**
   * Count the number of objects in this model, selecting on column (meaning
   * `NULL` values are not counted).
   *
   * @param column Property name to select on
   * @param criteria Criteria used to restrict selection
   * @param options
   */
  async countIn (
    column: keyof D,
    criteria?: types.Criteria<D>,
    options: types.AggregateOptions = {}
  ): Promise<number> {
    return baseCount<D>(this, column, criteria, options)
  }

  /**
   * Find the minimum value contained in this model, comparing all values in
   * `column` that match the given criteria.
   *
   * @param column Property name to inspect
   * @param criteria Criteria used to restrict selection
   * @param options
   */
  async min (
    column: keyof D,
    criteria?: types.Criteria<D>,
    options: types.AggregateOptions = {}
  ): Promise<number | undefined> {
    return baseMinMax(this, 'min', column, criteria, options)
  }

  /**
   * Find the maximum value contained in this model, comparing all values in
   * `column` that match the given criteria.
   *
   * @param column Property name to inspect
   * @param criteria Criteria used to restrict selection
   * @param options
   */
  async max (
    column: keyof D,
    criteria?: types.Criteria<D>,
    options?: types.AggregateOptions
  ): Promise<number | undefined> {
    return await baseMinMax(this, 'max', column, criteria, options)
  }
}
