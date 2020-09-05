import { Trilogy } from "."
import { Hooks, Hook } from "./hooks"

import * as helpers from "./helpers"
import {
  createTrigger,
  normalizeSchema,
  TriggerEvent,
  Cast
} from "./schema-helpers"
import {
  invariant, isString, isObject, toArray, firstOrValue
} from "./util"

import * as types from "./types"
import { Driver } from "./constants"

const baseCount = async <
  T extends types.LooseObject,
  Props extends types.ModelProps<T>
> (
  model: Model<T, Props>,
  column: keyof Props["schema"],
  criteria?: types.Criteria<Props["objectInput"]>,
  options: types.AggregateOptions = {}
): Promise<number> => {
  invariant(
    column != null && isString(column),
    `invalid column: expected string, got ${typeof column}`
  )

  types.AggregateOptions.check(options)

  const val = `${String(column)} as count`
  const builder = model.ctx.knex(model.name)
  let query = options.distinct ? builder.countDistinct(val) : builder.count(val)
  query = helpers.buildWhere(query, model.cast.toDefinition(
    criteria ?? {},
    { raw: true, ...options }
  ))

  if (options.group != null) query = query.groupBy(toArray(options.group))

  // TODO: please, for the love of all in the cosmos, give me https://github.com/microsoft/TypeScript/pull/26349
  const result = await helpers.getQueryResult<Driver, typeof query, Props, [{ count: number }] | undefined>(model.ctx, query, {
    model
  })
  return Array.isArray(result) ? result[0].count : 0
}

const baseMinMax = async <
  T extends types.LooseObject,
  Props extends types.ModelProps<T>
> (
  model: Model<T, Props>,
  method: "min" | "max",
  column: keyof Props["objectOutput"],
  criteria?: types.Criteria<Props["objectOutput"]>,
  options: types.AggregateOptions = {}
): Promise<number | undefined> => {
  types.AggregateOptions.check(options)

  const val = `${String(column)} as ${method}`
  let query = model.ctx.knex(model.name)[method](val)
  query = helpers.buildWhere(query, model.cast.toDefinition(
    criteria ?? {},
    { raw: true, ...options }
  ))

  if (options.group != null) query = query.groupBy(toArray(options.group))

  // TODO: please, for the love of all in the cosmos, give me https://github.com/microsoft/TypeScript/pull/26349
  const result = await helpers.getQueryResult<Driver, typeof query, Props, [Record<"min" | "max", number>] | undefined>(model.ctx, query, {
    model: model
  })
  return Array.isArray(result) ? result[0][method] : undefined
}

const baseGet = async <
  T extends types.LooseObject,
  Props extends types.ModelProps<T>,
  K extends keyof Props["objectOutput"]
> (
  model: Model<T, Props>,
  column: K,
  criteria: types.Criteria<Props["objectOutput"]> | undefined,
  defaultValue?: Props["objectOutput"][K],
  options?: types.LooseObject
): Promise<Props["objectOutput"][K] | undefined> => {
  const data = await model.findOneIn(column, criteria, options)
  return data ?? defaultValue
}

const baseSet = async <
  T extends types.LooseObject,
  Props extends types.ModelProps<T>,
  K extends keyof Props["objectOutput"]
> (
  model: Model<T, Props>,
  column: K,
  criteria: types.Criteria<Props["objectOutput"]> | undefined,
  value?: Props["objectOutput"][K],
  options?: types.LooseObject
): Promise<Array<Props["objectOutput"]>> => {
  invariant(
    model.schema[column as string],
    `no column by the name '${String(column)}' is defined in '${model.name}'`
  )

  return model.update(criteria, {
    [column]: value
  } as Partial<Props["objectOutput"]>, options)
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
  T extends types.LooseObject = types.LooseObject,
  Props extends types.ModelProps<T> = types.ModelProps<T>
> extends Hooks<Props> {
  schema: types.SchemaNormalized<Props["schema"]>
  cast: Cast<T, Props>

  /**
   * @param ctx trilogy instance used as a context for the model
   * @param name Name associated with this model and used in the backend
   * @param schema An object defining the fields & types of objects
   * @param options
   */
  constructor (
    public ctx: Trilogy,
    public name: string,
    schema: Props["schema"],
    public options: types.ModelOptions
  ) {
    super()
    this.schema = normalizeSchema(schema, options)
    this.cast = new Cast(this)
  }

  /**
   * Create an object on the given model. `object` should match the model's
   * defined schema but values will cast into types as needed.
   *
   * @param object Data to insert
   * @param options
   */
  async create (
    object: Props["objectInput"],
    options: types.CreateOptions = {}
  ): Promise<Props["objectOutput"] | undefined> {
    const { prevented } =
      await this._callHook(Hook.BeforeCreate, object, options)

    if (prevented) return

    const insertion = this.cast.toDefinition(object, options)

    const [returning, cleanup] =
      await createTrigger(this, TriggerEvent.Insert)

    const query = this.ctx.knex.raw(
      this.ctx.knex(this.name)
        .insert(insertion)
        .toSQL()
        .sql
        .replace(/^insert/i, "INSERT OR IGNORE")
    )

    await helpers.executeQuery<Props>(this.ctx, query, {
      model: this
    })

    // TODO: please, for the love of all in the cosmos, give me https://github.com/microsoft/TypeScript/pull/26349
    const result = await helpers.getQueryResult<Driver, typeof returning, Props, types.Nullable<Props["objectOutput"] | Array<Props["objectOutput"]>>>(this.ctx, returning, {
      model: this,
      internal: true
    })
    await cleanup()

    const created = result == null || (Array.isArray(result) && result.length < 1)
      ? undefined
      : this.cast.fromDefinition(firstOrValue(result), options)

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
    criteria?: types.Criteria<Props["objectOutput"]>,
    options: types.FindOptions = {}
  ): Promise<Array<Props["objectOutput"]>> {
    types.FindOptions.check(options)

    const order = options.random ? "random" : options.order
    let query = this.ctx.knex(this.name).select()
    query = helpers.buildWhere(query, this.cast.toDefinition(
      criteria ?? {},
      { raw: true, ...options }
    ))

    if (order != null) query = helpers.buildOrder(query, order)
    if (options.limit != null) query = query.limit(options.limit)
    if (options.skip != null) query = query.offset(options.skip)

    // TODO: please, for the love of all in the cosmos, give me https://github.com/microsoft/TypeScript/pull/26349
    const result = await helpers.getQueryResult<Driver, typeof query, Props, types.Nullable<Props["objectOutput"] | Array<Props["objectOutput"]>>>(this.ctx, query, {
      model: this
    })

    if (!Array.isArray(result)) {
      return result != null ? [result] : []
    }

    return result.map(object => {
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
    column: keyof Props["schema"],
    criteria?: types.Criteria<Props["objectOutput"]>,
    options?: types.FindOptions
  ): Promise<Array<types.ValueOf<Props["objectOutput"]>>> {
    const result = await this.find(criteria, options)
    return result.map(object => {
      return this.cast.fromColumnDefinition(
        column,
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
    criteria?: types.Criteria<Props["objectOutput"]>,
    options: types.FindOptions = {}
  ): Promise<Props["objectOutput"] | undefined> {
    types.FindOptions.check(options)

    const order = options.random ? "random" : options.order
    let query = this.ctx.knex(this.name).first()
    query = helpers.buildWhere(query, this.cast.toDefinition(
      criteria ?? {},
      { raw: true, ...options }
    ))

    if (order != null) query = helpers.buildOrder(query, order)
    if (options.skip != null) query = query.offset(options.skip)

    // TODO: please, for the love of all in the cosmos, give me https://github.com/microsoft/TypeScript/pull/26349
    const response = await helpers.getQueryResult<Driver, typeof query, Props, types.Listable<Props["objectOutput"]>>(this.ctx, query, {
      model: this
    })

    const result = firstOrValue<Props["objectOutput"]>(response)
    if (result == null) return undefined

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
  async findOneIn <K extends keyof Props["objectOutput"] = keyof Props["objectOutput"], V = Props["objectOutput"][K]> (
    column: K,
    criteria?: types.Criteria<Props["objectOutput"]>,
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
    criteria: types.CriteriaObj<Props["objectOutput"]>,
    creation: Partial<Props["objectOutput"]> = {},
    options?: types.FindOptions
  ): Promise<Props["objectOutput"] | undefined> {
    return (
      await this.findOne(criteria, options) ??
      // TODO: get rid of this `any` cast
      this.create({ ...criteria, ...creation } as any)
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
    criteria: types.Criteria<Props["objectOutput"]> = {},
    data: Partial<Props["objectOutput"]> = {},
    options: types.UpdateOptions = {}
  ): Promise<Array<Props["objectOutput"]>> {
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

    await helpers.executeQuery<Props>(this.ctx, query, { model: this })

    // TODO: please, for the love of all in the cosmos, give me https://github.com/microsoft/TypeScript/pull/26349
    const updatedRaw = await helpers.getQueryResult<Driver, typeof returning, Props, Array<Props["objectOutput"]>>(this.ctx, returning, {
      model: this,
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
    criteria: types.CriteriaObj<Props["objectOutput"]>,
    data: Partial<Props["objectOutput"]>,
    options: types.UpdateOptions & types.CreateOptions = {}
  ): Promise<Array<Props["objectOutput"]>> {
    const found = await this.find(criteria, options)

    if (found.length < 1) {
      // TODO: get rid of this `any` cast
      return this.create({ ...criteria, ...data } as any, options)
        .then(res => toArray<Props["objectOutput"]>(res as Props["objectOutput"]))
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
  async get <K extends keyof Props["objectOutput"] = keyof Props["objectOutput"], V extends Props["objectOutput"][K] = Props["objectOutput"][K]> (
    column: K, criteria?: types.Criteria<Props["objectOutput"]>, defaultValue?: V
  ): Promise<Props["objectOutput"][K] | undefined> {
    return baseGet(this, column, criteria, defaultValue)
  }

  /**
   * Works similarly to the `set` methods in lodash, underscore, etc. Updates
   * the value at `column` to be `value` where the given criteria is met.
   *
   * @param column Property name of the object at which to set the value
   * @param criteria Criteria used to restrict selection
   * @param value Value returned if the result doesn't exist
   */
  async set <K extends keyof Props["objectOutput"] = keyof Props["objectOutput"], V extends Props["objectOutput"][K] = Props["objectOutput"][K]> (
    column: K, criteria: types.Criteria<Props["objectOutput"]>, value: V
  ): Promise<Array<Props["objectOutput"]>> {
    return baseSet(this, column, criteria, value)
  }

  /**
   * Works exactly like `get` but bypasses getters and retrieves the raw database value.
   *
   * @param column Property name of the object to extract the value from
   * @param criteria Criteria used to restrict selection
   * @param defaultValue Value returned if the result doesn't exist
   */
  async getRaw <K extends keyof Props["objectOutput"] = keyof Props["objectOutput"], V extends Props["objectOutput"][K] = Props["objectOutput"][K]> (
    column: K, criteria: types.Criteria<Props["objectOutput"]>, defaultValue?: V
  ): Promise<Props["objectOutput"][K] | undefined> {
    return baseGet(this, column, criteria, defaultValue, { raw: true })
  }

  /**
   * Works exactly like `set` but bypasses setters when updating the target value.
   *
   * @param column Property name of the object at which to set the value
   * @param criteria Criteria used to restrict selection
   * @param value Value returned if the result doesn't exist
   */
  async setRaw <K extends keyof Props["objectOutput"] = keyof Props["objectOutput"], V extends Props["objectOutput"][K] = Props["objectOutput"][K]> (
    column: K, criteria: types.Criteria<Props["objectOutput"]>, value: V
  ): Promise<Array<Props["objectOutput"]>> {
    return baseSet(this, column, criteria, value, { raw: true })
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
    column: keyof Props["objectOutput"],
    criteria?: types.Criteria<Props["objectOutput"]>,
    amount?: number
  ): Promise<Array<Props["objectOutput"]>> {
    const { prevented } =
      await this._callHook(Hook.BeforeUpdate, [{}, criteria as types.Criteria<Props["objectOutput"]>])

    if (prevented) return []

    const cast = Number(amount)
    if (Number.isNaN(cast)) amount = 1
    if (amount === 0) return []

    const [returning, cleanup] = await createTrigger(this, TriggerEvent.Update)

    let query = this.ctx.knex(this.name).increment(column as string, amount)
    query = helpers.buildWhere(query, criteria)

    const affected = await helpers.executeQuery<Props>(this.ctx, query, { model: this })
    if (affected === 0) return []

    // TODO: please, for the love of all in the cosmos, give me https://github.com/microsoft/TypeScript/pull/26349
    const updatedRaw = await helpers.getQueryResult<Driver, typeof returning, Props, Array<Props["objectOutput"]>>(this.ctx, returning, {
      model: this,
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
    column: keyof Props["objectOutput"],
    criteria?: types.Criteria<Props["objectOutput"]>,
    amount?: number,
    allowNegative?: boolean
  ): Promise<Array<Props["objectOutput"]>> {
    const { prevented } =
      await this._callHook(Hook.BeforeUpdate, [{}, criteria as types.Criteria<Props["objectOutput"]>])

    if (prevented) return []

    const cast = Number(amount)
    if (Number.isNaN(cast)) amount = 1
    if (amount === 0) return []

    const [returning, cleanup] = await createTrigger(this, TriggerEvent.Update)

    const raw = allowNegative ? "?? - ?" : "MAX(0, ?? - ?)"
    const query = helpers.buildWhere(
      this.ctx.knex(this.name).update({
        [column]: this.ctx.knex.raw(raw, [column, amount] as [string, number])
      }),
      criteria
    )

    const affected = await helpers.executeQuery<Props>(this.ctx, query, { model: this })
    if (affected === 0) return []

    // TODO: please, for the love of all in the cosmos, give me https://github.com/microsoft/TypeScript/pull/26349
    const updatedRaw = await helpers.getQueryResult<Driver, typeof returning, Props, Array<Props["objectOutput"]>>(this.ctx, returning, {
      model: this,
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
  async remove (criteria: types.Criteria<Props["objectOutput"]>): Promise<Array<Props["objectOutput"]>> {
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

    const deleteCount = await helpers.executeQuery<Props>(this.ctx, query, {
      model: this
    })

    if (deleteCount === 0) return []

    // TODO: please, for the love of all in the cosmos, give me https://github.com/microsoft/TypeScript/pull/26349
    const deleted = await helpers.getQueryResult<Driver, typeof returning, Props, Array<Props["objectOutput"]>>(this.ctx, returning, {
      model: this,
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
    return helpers.executeQuery<Props>(this.ctx, query, { model: this })
  }

  /**
   * Count the number of objects in this model.
   *
   * @param criteria Criteria used to restrict selection
   * @param options
   */
  async count (
    criteria?: types.Criteria<Props["objectOutput"]>,
    options: types.AggregateOptions = {}
  ): Promise<number> {
    return baseCount(this, "*", criteria, options)
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
    column: types.StringKeys<Props["objectOutput"]>,
    criteria?: types.Criteria<Props["objectOutput"]>,
    options: types.AggregateOptions = {}
  ): Promise<number> {
    return baseCount(this, column, criteria, options)
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
    column: keyof Props["objectOutput"],
    criteria?: types.Criteria<Props["objectOutput"]>,
    options: types.AggregateOptions = {}
  ): Promise<number | undefined> {
    return baseMinMax(this, "min", column, criteria, options)
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
    column: keyof Props["objectOutput"],
    criteria?: types.Criteria<Props["objectOutput"]>,
    options?: types.AggregateOptions
  ): Promise<number | undefined> {
    return baseMinMax(this, "max", column, criteria, options)
  }
}
