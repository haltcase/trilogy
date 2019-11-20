import { dirname, resolve } from 'path'
import { openSync, closeSync } from 'fs'

import * as knex from 'knex'

import Model from './model'
import { runQuery } from './helpers'
import { toKnexSchema } from './schema-helpers'
import { pureConnect } from './sqljs-handler'
import { invariant, makeDirPath } from './util'

import { Pool } from 'generic-pool'
import { SqlJs } from 'sql.js/module'
import * as hooks from './hooks'
import * as types from './types'

const ensureExists = (atPath: string) => {
  try {
    closeSync(openSync(atPath, 'wx'))
  } catch {}
}

const initOptions = (path: string, options: types.TrilogyOptions) => ({
  ...{ client: 'sqlite3' as const, dir: process.cwd() },
  ...types.TrilogyOptions.check(options),
  ...{ connection: { filename: path } }
})

/**
 * Initialize a new datastore instance, creating a SQLite database file at
 * the provided path if it does not yet exist, or reading it if it does.
 *
 * It's recommended to use the {@link connect} function to create instances
 * rather than instantiating this class directly.
 *
 * @remarks
 * If path is exactly `':memory:'`, no file will be created and a memory-only
 * store will be used. This doesn't persist any of the data.
 */
export class Trilogy {
  /**
   * Indicates whether the database is using the `sqlite3` client (`true`) or
   * the `sql.js` (`false`) backend.
   */
  isNative: boolean

  /**
   * The knex instance used for building queries.
   */
  knex: knex

  /**
   * Normalized configuration of this trilogy instance.
   */
  options: types.Defined<types.TrilogyOptions> & {
    connection: { filename: string }
  }

  /**
   * Connection pool for managing a sql.js instance.
   *
   * @internal
   */
  pool?: Pool<SqlJs.Database>

  private _definitions: Map<string, Model<any>>

  /**
   * @param path File path or `':memory:'` for in-memory storage
   * @param options Configuration for this trilogy instance
   */
  constructor (path: string, options: types.TrilogyOptions = {}) {
    invariant(path, 'trilogy constructor must be provided a file path')

    const obj = this.options = initOptions(path, options)

    if (path === ':memory:') {
      obj.connection.filename = path
    } else {
      obj.connection.filename = resolve(obj.dir, path)

      // ensure the directory exists
      makeDirPath(dirname(obj.connection.filename))
    }

    this.isNative = obj.client === 'sqlite3'

    if (path !== ':memory:') {
      ensureExists(obj.connection.filename)
    }

    const config = { client: 'sqlite3', useNullAsDefault: true }

    if (this.isNative) {
      this.knex = knex(({ ...config, connection: obj.connection } as knex.Config))
    } else {
      this.knex = knex(config)
      this.pool = pureConnect(this)
    }

    this._definitions = new Map()
  }

  /**
   * Array of all model names defined on the instance.
   */
  get models () {
    return [...this._definitions.keys()]
  }

  /**
   * Define a new model with the provided schema, or return the existing
   * model if one is already defined with the given name.
   *
   * @param name Name of the model
   * @param schema Object defining the schema of the model
   * @param options Configuration for this model instance
   */
  async model <D extends types.ReturnDict = types.LooseObject> (
    name: string,
    schema: types.SchemaRaw<D>,
    options: types.ModelOptions = {}
  ): Promise<Model<D>> {
    if (this._definitions.has(name)) {
      return this._definitions.get(name) as Model<D>
    }

    const model = new Model<D>(this, name, schema, options)
    this._definitions.set(name, model)

    const opts = toKnexSchema(
      model,
      types.ModelOptions.check(options)
    )
    const check = this.knex.schema.hasTable(name)
    const query = this.knex.schema.createTable(name, opts)

    if (this.isNative) {
      // tslint:disable-next-line:await-promise
      if (!await check) {
        // tslint:disable-next-line:await-promise
        await query
      }
    } else {
      if (!await runQuery(this, check, { needResponse: true })) {
        await runQuery(this, query)
      }
    }

    return model
  }

  /**
   * Synchronously retrieve a model if it exists. If that model doesn't exist
   * an error will be thrown.
   *
   * @param name Name of the model
   *
   * @throws if `name` has not already been defined
   */
  getModel <D extends types.ReturnDict = types.LooseObject> (name: string): Model<D> | never {
    return invariant(
      this._definitions.get(name) as Model<D>,
      `no model defined by the name '${name}'`
    )
  }

  /**
   * First checks if the model's been defined with trilogy, then runs an
   * existence query on the database, returning `true` if the table exists
   * or `false` if it doesn't.
   *
   * @param name Name of the model
   */
  async hasModel (name: string): Promise<boolean> {
    if (!this._definitions.has(name)) {
      return false
    }

    const query = this.knex.schema.hasTable(name)
    return runQuery(this, query, { needResponse: true })
  }

  /**
   * Removes the specified model from trilogy's definition and the database.
   *
   * @param name Name of the model to remove
   */
  async dropModel (name: string): Promise<boolean> {
    if (!this._definitions.has(name)) {
      return false
    }

    const query = this.knex.schema.dropTableIfExists(name)
    await runQuery(this, query, { needResponse: true })
    this._definitions.delete(name)
    return true
  }

  /**
   * Allows running any arbitrary query generated by trilogy's `knex` instance.
   * If the result is needed, pass `true` as the second argument, otherwise the
   * number of affected rows will be returned ( if applicable ).
   *
   * @param query Any query built with `knex`
   * @param [needResponse] Whether to return the result of the query
   */
  raw (query: knex.QueryBuilder | knex.Raw, needResponse?: boolean) {
    return runQuery(this, query, { needResponse })
  }

  /**
   * Drains the connection pools and releases connections to any open database
   * files. This should always be called at the end of your program to
   * gracefully shut down, and only once since the connection can't be reopened.
   */
  close () {
    if (this.isNative) {
      // must wrap this return value in native Promise due to
      // https://github.com/petkaantonov/bluebird/issues/1277
      return Promise.resolve(this.knex.destroy())
    } else {
      return this.pool!.drain()
    }
  }

  /**
   * Create an object on the given model. `object` should match the model's
   * defined schema but values will cast into types as needed.
   *
   * @param modelName Name of the existing model where the object will be created
   * @param object Data to insert
   * @param options
   */
  create <T = types.LooseObject> (
    modelName: string,
    object: types.LooseObject,
    options?: types.LooseObject
  ): Promise<T>
  create (
    modelName: string,
    object: types.LooseObject,
    options?: types.LooseObject
  ) {
    const model = this.getModel(modelName)
    return model.create(object, options)
  }

  /**
   * Find all objects matching a given criteria.
   *
   * @param location Model name and an optional column in dot-notation
   * @param criteria Criteria used to restrict selection
   * @param options
   */
  find <T = types.LooseObject> (
    location: string,
    criteria?: types.Criteria,
    options?: types.FindOptions
  ): Promise<T[]>
  find (
    location: string,
    criteria?: types.Criteria,
    options?: types.FindOptions
  ) {
    const [table, column] = location.split('.', 2)
    const model = this.getModel(table)
    if (column) {
      return model.findIn(column, criteria, options)
    } else {
      return model.find(criteria, options)
    }
  }

  /**
   * Find a single object matching a given criteria. The first matching
   * object is returned.
   *
   * @param location Model name and an optional column in dot-notation
   * @param criteria Criteria used to restrict selection
   * @param options
   */
  findOne <T = types.LooseObject> (
    location: string,
    criteria?: types.Criteria,
    options?: types.FindOptions
  ): Promise<T>
  findOne (
    location: string,
    criteria?: types.Criteria,
    options?: types.FindOptions
  ) {
    const [table, column] = location.split('.', 2)
    const model = this.getModel(table)
    if (column) {
      return model.findOneIn(column, criteria, options)
    } else {
      return model.findOne(criteria, options)
    }
  }

  /**
   * Find a matching object based on the given criteria, or create it if it
   * doesn't exist. When creating the object, a merged object created from
   * `criteria` and `creation` will be used, with the properties from
   * `creation` taking precedence.
   *
   * @param modelName Name of the model
   * @param criteria Criteria to search for
   * @param creation Data used to create the object if it doesn't exist
   * @param options
   */
  findOrCreate <T = types.LooseObject> (
    modelName: string,
    criteria: types.Criteria,
    creation?: types.LooseObject,
    options?: types.FindOptions
  ): Promise<T>
  findOrCreate (
    modelName: string,
    criteria: types.Criteria,
    creation?: types.LooseObject,
    options?: types.FindOptions
  ) {
    const model = this.getModel(modelName)
    return model.findOrCreate(criteria, creation, options)
  }

  /**
   * Modify the properties of an existing object. While optional, if `data`
   * contains no properties no update queries will be run.
   *
   * @param modelName Name of the model
   * @param criteria Criteria used to restrict selection
   * @param data Updates to be made on matching objects
   * @param options
   */
  update (
    modelName: string,
    criteria: types.Criteria,
    data: types.LooseObject,
    options?: types.UpdateOptions
  ) {
    const model = this.getModel(modelName)
    return model.update(criteria, data, options)
  }

  /**
   * Update an existing object or create it if it doesn't exist. If creation
   * is necessary a merged object created from `criteria` and `data` will be
   * used, with the properties from `data` taking precedence.
   *
   * @param modelName Name of the model
   * @param criteria Criteria used to restrict selection
   * @param data Updates to be made on matching objects
   * @param options
   */
  updateOrCreate (
    modelName: string,
    criteria: types.Criteria,
    data: types.LooseObject,
    options?: types.CreateOptions & types.UpdateOptions
  ) {
    const model = this.getModel(modelName)
    return model.updateOrCreate(criteria, data, options)
  }

  /**
   * Works similarly to the `get` methods in lodash, underscore, etc. Returns
   * the value at `column` or, if it does not exist, the supplied `defaultValue`.
   * Essentially a useful shorthand for some `find` scenarios.
   *
   * @param location Model name and a column in dot-notation
   * @param criteria Criteria used to restrict selection
   * @param defaultValue Value returned if the result doesn't exist
   */
  get <T = types.ReturnType> (
    location: string,
    criteria: types.Criteria,
    defaultValue?: T
  ): Promise<T>
  get (
    location: string,
    criteria: types.Criteria,
    defaultValue?: any
  ): Promise<any> {
    const [table, column] = location.split('.', 2)

    invariant(column, 'property name is required, ex: `get("users.rank")`')

    const model = this.getModel(table)
    return model.get(column, criteria, defaultValue)
  }

  /**
   * Works similarly to the `set` methods in lodash, underscore, etc. Updates
   * the value at `column` to be `value` where the given criteria is met.
   *
   * @param location Model name and a column in dot-notation
   * @param criteria Criteria used to restrict selection
   * @param value Value returned if the result doesn't exist
   */
  set <T> (location: string, criteria: types.Criteria, value: T) {
    const [table, column] = location.split('.', 2)

    invariant(column, 'property name is required, ex: `set("users.rank")`')

    const model = this.getModel(table)
    return model.set(column, criteria, value)
  }

  /**
   * Works exactly like `get` but bypasses getters and retrieves the raw database value.
   *
   * @param location Model name and a column in dot-notation
   * @param criteria Criteria used to restrict selection
   * @param defaultValue Value returned if the result doesn't exist
   */
  getRaw <T> (location: string, criteria: types.Criteria, defaultValue: T): Promise<T>
  getRaw (location: string, criteria: types.Criteria): Promise<types.ReturnType>
  getRaw (
    location: string,
    criteria: types.Criteria,
    defaultValue?: any
  ): Promise<any> {
    const [table, column] = location.split('.', 2)

    invariant(column, 'property name is required, ex: `getRaw("users.rank")`')

    const model = this.getModel(table)
    return model.getRaw(column, criteria, defaultValue)
  }

  /**
   * Works exactly like `set` but bypasses setters when updating the target value.
   *
   * @param location Model name and a column in dot-notation
   * @param criteria Criteria used to restrict selection
   * @param value Value returned if the result doesn't exist
   */
  setRaw <T> (location: string, criteria: types.Criteria, value: T) {
    const [table, column] = location.split('.', 2)

    invariant(column, 'property name is required, ex: `setRaw("users.rank")`')

    const model = this.getModel(table)
    return model.setRaw(column, criteria, value)
  }

  /**
   * Increment the value of a given model's property by the specified amount,
   * which defaults to `1` if not provided.
   *
   * @param location Model name and a column in dot-notation
   * @param criteria Criteria used to restrict selection
   * @param amount
   */
  increment (location: string, criteria: types.Criteria, amount?: number) {
    const [table, column] = location.split('.', 2)
    const model = this.getModel(table)
    return model.increment(column, criteria, amount)
  }

  /**
   * Decrement the value of a given model's property by the specified amount,
   * which defaults to `1` if not provided.
   *
   * @param location Model name and a column in dot-notation
   * @param criteria Criteria used to restrict selection
   * @param amount
   */
  decrement (
    location: string,
    criteria: types.Criteria,
    amount?: number,
    allowNegative?: boolean
  ) {
    const [table, column] = location.split('.', 2)
    const model = this.getModel(table)
    return model.decrement(column, criteria, amount, allowNegative)
  }

  /**
   * Delete objects matching `criteria` from the given model.
   *
   * @remarks
   * If `criteria` is empty or absent, nothing will be done. This is a safeguard
   * against unintentionally deleting everything in the model. Use `clear` if
   * you really want to remove all rows.
   *
   * @param modelName Name of the model
   * @param criteria Criteria used to restrict selection
   */
  remove (modelName: string, criteria: types.Criteria) {
    const model = this.getModel(modelName)
    return model.remove(criteria)
  }

  /**
   * Delete all objects from the given model.
   *
   * @param modelName Name of the model
   */
  clear (modelName: string) {
    const model = this.getModel(modelName)
    return model.clear()
  }

  /**
   * Count the number of objects in the given model.
   *
   * @param location Model name and an optional column in dot-notation
   * @param criteria Criteria used to restrict selection
   * @param options
   */
  count (
    location?: string,
    criteria?: types.Criteria,
    options?: types.AggregateOptions
  ): Promise<number> {
    if (location == null && criteria == null && options == null) {
      const query = this.knex('sqlite_master')
        .whereNot('name', 'sqlite_sequence')
        .where({ type: 'table' })
        .count('* as count')

      return runQuery(this, query, { needResponse: true })
        .then(([{ count }]) => count)
    }

    const [table, column] = (location ?? '').split('.', 2)
    const model = this.getModel(table)
    return column
      ? model.countIn(column, criteria, options)
      : model.count(criteria, options)
  }

  /**
   * Find the minimum value contained in the model, comparing all values in
   * `column` that match the given criteria.
   *
   * @param location Model name and a column in dot-notation
   * @param criteria Criteria used to restrict selection
   * @param options
   */
  min (location: string, criteria: types.Criteria, options?: types.AggregateOptions) {
    const [table, column] = location.split('.', 2)

    invariant(column, 'property name is required, ex: `min("users.rank")`')

    const model = this.getModel(table)
    return model.min(column, criteria, options)
  }

  /**
   * Find the maximum value contained in the model, comparing all values in
   * `column` that match the given criteria.
   *
   * @param location Model name and a column in dot-notation
   * @param criteria Criteria used to restrict selection
   * @param options
   */
  max (location: string, criteria: types.Criteria, options?: types.AggregateOptions) {
    const [table, column] = location.split('.', 2)

    invariant(column, 'property name is required, ex: `max("users.rank")`')

    const model = this.getModel(table)
    return model.max(column, criteria, options)
  }

  /**
   * The `onQuery` hook is called each time a query is run on the database,
   * and receives the query in string form.
   *
   * @param [modelName] Optional, name of the model this subscriber will attach to
   * @param fn Function called when the hook is triggered
   * @param options
   *
   * @returns Unsubscribe function that removes the subscriber when called
   */
  onQuery (
    ...args:
      | [hooks.OnQueryCallback, hooks.OnQueryOptions?]
      | [string, hooks.OnQueryCallback, hooks.OnQueryOptions?]
  ): types.Fn<[], boolean> {
    // tslint:disable-next-line:no-empty
    let fn: hooks.OnQueryCallback = () => {}
    let location = ''
    let options: hooks.OnQueryOptions = {
      includeInternal: false
    }

    if (args.length === 1) {
      fn = args[0]
    }

    if (args.length >= 2) {
      if (typeof args[0] === 'string') {
        location = args[0]
      } else if (typeof args[1] === 'function') {
        fn = args[0]
      }

      if (typeof args[1] === 'function') {
        fn = args[1]
      } else {
        options = { ...options, ...args[1] }
      }
    }

    if (args.length === 3) {
      options = args[2] || options
    }

    // console.log({ location, fn, options })

    if (location !== '') {
      // all queries run on the model identified by `location`
      return this.getModel(location).onQuery(fn, options)
    }

    // all queries run across all defined models
    const unsubs: types.Fn<[], boolean>[] =
      Array.from(new Array(this._definitions.size))

    let i = -1
    this._definitions.forEach(model => {
      unsubs[++i] = model.onQuery(fn, options)
    })

    return () => unsubs.every(unsub => unsub())
  }

  /**
   * Before an object is created, the beforeCreate hook is called with the
   * object.
   *
   * @remarks
   * This hook occurs before casting, so if a subscriber to this hook
   * modifies the incoming object those changes will be subject to casting.
   * It's also possible to prevent the object from being created entirely
   * by returning the EventCancellation symbol from a subscriber callback.
   *
   * @param [modelName] Optional, name of the model this subscriber will attach to
   * @param fn Function called when the hook is triggered
   *
   * @returns Unsubscribe function that removes the subscriber when called
   */
  beforeCreate <D extends types.ReturnDict = types.LooseObject> (
    ...args: [hooks.BeforeCreateCallback<D>] | [string, hooks.BeforeCreateCallback<D>]
  ): types.Fn<[], boolean> {
    if (args.length === 2) {
      // all creations run on the model identified by `scope`
      const [location, fn] = args
      return this.getModel<D>(location).beforeCreate(fn)
    } else {
      // all creations run across all defined models
      const [fn] = args
      const unsubs: types.Fn<[], boolean>[] =
        Array.from(new Array(this._definitions.size))

      let i = -1
      this._definitions.forEach(model => {
        unsubs[++i] = model.beforeCreate(fn)
      })

      return () => unsubs.every(unsub => unsub())
    }
  }

  /**
   * When an object is created, that object is returned to you and the
   * `afterCreate` hook is called with it.
   *
   * @param [modelName] Optional, name of the model this subscriber will attach to
   * @param fn Function called when the hook is triggered
   *
   * @returns Unsubscribe function that removes the subscriber when called
   */
  afterCreate <D extends types.ReturnDict = types.LooseObject> (
    ...args: [hooks.AfterCreateCallback<D>] | [string, hooks.AfterCreateCallback<D>]
  ): types.Fn<[], boolean> {
    if (args.length === 2) {
      // all creations run on the model identified by `scope`
      const [location, fn] = args
      return this.getModel<D>(location).afterCreate(fn)
    } else {
      // all creations run across all defined models
      const [fn] = args
      const unsubs: types.Fn<[], boolean>[] =
        Array.from(new Array(this._definitions.size))

      let i = -1
      this._definitions.forEach(model => {
        unsubs[++i] = model.afterCreate(fn)
      })

      return () => unsubs.every(unsub => unsub())
    }
  }

  /**
   * Prior to an object being updated the `beforeUpdate` hook is called with the
   * update delta, or the incoming changes to be made, as well as the criteria.
   *
   * @remarks
   * Casting occurs after this hook. A subscriber could choose to cancel the
   * update by returning the EventCancellation symbol or alter the selection
   * criteria.
   *
   * @param [modelName] Optional, name of the model this subscriber will attach to
   * @param fn Function called when the hook is triggered
   *
   * @returns Unsubscribe function that removes the subscriber when called
   */
  beforeUpdate <D extends types.ReturnDict = types.LooseObject> (
    ...args: [hooks.BeforeUpdateCallback<D>] | [string, hooks.BeforeUpdateCallback<D>]
  ): types.Fn<[], boolean> {
    if (args.length === 2) {
      // all updates run on the model identified by `scope`
      const [location, fn] = args
      return this.getModel<D>(location).beforeUpdate(fn)
    } else {
      // all updates run across all defined models
      const [fn] = args
      const unsubs: types.Fn<[], boolean>[] =
        Array.from(new Array(this._definitions.size))

      let i = -1
      this._definitions.forEach((model: Model<D>) => {
        unsubs[++i] = model.beforeUpdate(fn)
      })

      return () => unsubs.every(unsub => unsub())
    }
  }

  /**
   * Subscribers to the `afterUpdate` hook receive modified objects after they
   * are updated.
   *
   * @param [modelName] Optional, name of the model this subscriber will attach to
   * @param fn Function called when the hook is triggered
   *
   * @returns Unsubscribe function that removes the subscriber when called
   */
  afterUpdate <D extends types.ReturnDict = types.LooseObject> (
    ...args: [hooks.AfterUpdateCallback<D>] | [string, hooks.AfterUpdateCallback<D>]
  ): types.Fn<[], boolean> {
    if (args.length === 2) {
      // all updates run on the model identified by `scope`
      const [location, fn] = args
      return this.getModel<D>(location).afterUpdate(fn)
    } else {
      // all updates run across all defined models
      const [fn] = args
      const unsubs: types.Fn<[], boolean>[] =
        Array.from(new Array(this._definitions.size))

      let i = -1
      this._definitions.forEach(model => {
        unsubs[++i] = model.afterUpdate(fn)
      })

      return () => unsubs.every(unsub => unsub())
    }
  }

  /**
   * Before object removal, the criteria for selecting those objects is passed
   * to the `beforeRemove` hook.
   *
   * @remarks
   * Casting occurs after this hook. Subscribers can modify the selection
   * criteria or prevent the removal entirely by returning the `EventCancellation`
   * symbol.
   *
   * @param [modelName] Optional, name of the model this subscriber will attach to
   * @param fn Function called when the hook is triggered
   *
   * @returns Unsubscribe function that removes the subscriber when called
   */
  beforeRemove <D extends types.ReturnDict = types.LooseObject> (
    ...args: [hooks.BeforeRemoveCallback<D>] | [string, hooks.BeforeRemoveCallback<D>]
  ): types.Fn<[], boolean> {
    if (args.length === 2) {
      // all removals run on the model identified by `scope`
      const [location, fn] = args
      return this.getModel<D>(location).beforeRemove(fn)
    } else {
      // all removals run across all defined models
      const [fn] = args
      const unsubs: types.Fn<[], boolean>[] =
        Array.from(new Array(this._definitions.size))

      let i = -1
      this._definitions.forEach((model: Model<D>) => {
        unsubs[++i] = model.beforeRemove(fn)
      })

      return () => unsubs.every(unsub => unsub())
    }
  }

  /**
   * A list of any removed objects is passed to the `afterRemove` hook.
   *
   * @param [modelName] Optional, name of the model this subscriber will attach to
   * @param fn Function called when the hook is triggered
   *
   * @returns Unsubscribe function that removes the subscriber when called
   */
  afterRemove <D extends types.ReturnDict = types.LooseObject> (
    ...args: [hooks.AfterRemoveCallback<D>] | [string, hooks.AfterRemoveCallback<D>]
  ): types.Fn<[], boolean> {
    if (args.length === 2) {
      // all removals run on the model identified by `scope`
      const [location, fn] = args
      return this.getModel<D>(location).afterRemove(fn)
    } else {
      // all removals run across all defined models
      const [fn] = args
      const unsubs: types.Fn<[], boolean>[] =
        Array.from(new Array(this._definitions.size))

      let i = -1
      this._definitions.forEach(model => {
        unsubs[++i] = model.afterRemove(fn)
      })

      return () => unsubs.every(unsub => unsub())
    }
  }
}

export {
  EventCancellation,
  OnQueryOptions,
  OnQueryCallback,
  BeforeCreateCallback,
  AfterCreateCallback,
  BeforeUpdateCallback,
  AfterUpdateCallback,
  BeforeRemoveCallback,
  AfterRemoveCallback,
  HookCallback
} from './hooks'

export { default as Model } from './model'
export * from './types'

/**
 * Initialize a new datastore instance, creating a SQLite database file at
 * the provided path if it does not yet exist, or reading it if it does.
 *
 * @param path File path or `':memory:'` for memory-only storage
 * @param options Configuration for this trilogy instance
 */
export const connect = (path: string, options?: types.TrilogyOptions) =>
  new Trilogy(path, options)
