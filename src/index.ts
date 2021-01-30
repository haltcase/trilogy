import { dirname, resolve } from "path"
import { openSync, closeSync, mkdirSync } from "fs"

import * as pool from "generic-pool"
import knex from "knex"
import { SqlJs } from "sql.js/module"
import { } from "type-fest"

import { Model } from "./model"
import { executeQuery, getQueryResult } from "./helpers"
import { toKnexSchema } from "./schema-helpers"
import { pureConnect } from "./sqljs-handler"
import { invariant } from "./util"

import * as hooks from "./hooks"
import { Driver } from "./constants"

import { ModelProps, ModelRecord, Schema, SchemaFromShape } from "./types/schemas"
import { Compulsory, Const, Fn } from "./types/utils"
import { ModelOptions, TrilogyOptions } from "./types/validators"

export type TrilogyOptionsNormalized = Compulsory<TrilogyOptions & {
  connection: { filename: string }
}>

const ensureExists = (atPath: string): void => {
  try {
    closeSync(openSync(atPath, "wx"))
  } catch {}
}

const initOptions = (path: string, options: TrilogyOptions): TrilogyOptionsNormalized => ({
  ...{ client: "sqlite3" as const, dir: process.cwd() },
  ...TrilogyOptions.check(options),
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
  options: TrilogyOptionsNormalized

  /**
   * Connection pool for managing a sql.js instance.
   *
   * @internal
   */
  pool?: pool.Pool<SqlJs.Database>

  readonly #definitions = new Map<string, Model<any, any>>()

  /**
   * @param path File path or `':memory:'` for in-memory storage
   * @param options Configuration for this trilogy instance
   */
  constructor (path: string, options: TrilogyOptions = {}) {
    invariant(path, "trilogy constructor must be provided a file path")

    const obj = this.options = initOptions(path, options)

    if (path === ":memory:") {
      obj.connection.filename = path
    } else {
      obj.connection.filename = resolve(obj.dir, path)

      // ensure the directory exists
      mkdirSync(dirname(obj.connection.filename), { recursive: true })
    }

    this.isNative = obj.client === "sqlite3"

    if (path !== ":memory:") {
      ensureExists(obj.connection.filename)
    }

    const config = { client: "sqlite3", useNullAsDefault: true }

    if (this.isNative) {
      this.knex = knex(({ ...config, connection: obj.connection } as knex.Config))
    } else {
      this.knex = knex(config)
      this.pool = pureConnect(this)
    }

    this.#definitions = new Map()
  }

  /**
   * Array of all model names defined on the instance.
   */
  get models (): string[] {
    return [...this.#definitions.keys()]
  }

  /**
   * Define a new model with the provided schema, or return the existing
   * model if one is already defined with the given name.
   *
   * @param name Name of the model
   * @param schema Object defining the schema of the model
   * @param options Configuration for this model instance
   */
  async model <T extends Schema> (
    name: string,
    schema: Const<T>,
    options: ModelOptions = {}
  ): Promise<Model<T>> {
    if (this.#definitions.has(name)) {
      return this.#definitions.get(name) as Model<T>
    }

    const model = new Model<T>(this, name, schema, options)
    this.#definitions.set(name, model)

    const opts = toKnexSchema(
      model,
      ModelOptions.check(options)
    )
    const check = this.knex.schema.hasTable(name)
    const query = this.knex.schema.createTable(name, opts)

    if (this.isNative) {
      if (!await check) {
        await query
      }
    } else {
      if (!await getQueryResult<Driver.js, typeof check>(this, check)) {
        await executeQuery(this, query)
      }
    }

    return model
  }

  /**
   * This method is primarily for TypeScript users when a specific
   * type needs to be modeled.
   *
   * Define a new model with a schema to be inferred by the shape
   * of the provided object type, or return the existing model if
   * one is already defined with the given name.
   *
   * @param name Name of the model
   * @param schema Object defining the schema of the model
   * @param options Configuration for this model instance
   */
  async modelWithShape <
    T extends ModelRecord = never,
    ModelSchema extends Schema = SchemaFromShape<T>
  > (
    name: string,
    schema: Const<ModelSchema>,
    options: ModelOptions = {}
  ): Promise<Model<ModelSchema>> {
    return new Model<ModelSchema>(this, name, schema, options)
  }

  /**
   * Synchronously retrieve a model if it exists. If that model doesn't exist
   * an error will be thrown.
   *
   * @param name Name of the model
   *
   * @throws if `name` has not already been defined
   */
  getModel <T extends Schema, Props extends ModelProps<T> = ModelProps<T>> (name: string): Model<T, Props> | never {
    const model = this.#definitions.get(name) as Model<T, Props>

    invariant(
      model != null,
      `no model defined by the name '${name}'`
    )

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
  getModelWithShape <
    T extends ModelRecord = never,
    ModelSchema extends Schema = SchemaFromShape<T>
  > (name: string): Model<ModelSchema> | never {
    const model = this.#definitions.get(name) as Model<ModelSchema>

    invariant(
      model != null,
      `no model defined by the name '${name}'`
    )

    return model
  }

  /**
   * First checks if the model's been defined with trilogy, then runs an
   * existence query on the database, returning `true` if the table exists
   * or `false` if it doesn't.
   *
   * @param name Name of the model
   */
  async hasModel (name: string): Promise<boolean> {
    if (!this.#definitions.has(name)) {
      return false
    }

    const query = this.knex.schema.hasTable(name)
    return getQueryResult<Driver, typeof query, Model<Schema>, boolean>(this, query)
  }

  /**
   * Removes the specified model from trilogy's definition and the database.
   *
   * @param name Name of the model to remove
   */
  async dropModel (name: string): Promise<boolean> {
    if (!this.#definitions.has(name)) {
      return false
    }

    const query = this.knex.schema.dropTableIfExists(name)
    await executeQuery(this, query)
    this.#definitions.delete(name)
    return true
  }

  /**
   * Returns the result of running an arbitrary query generated by trilogy's
   * `knex` instance.
   *
   * @param query Query built with `knex`
   */
  async getRawResult <T = unknown> (query: knex.QueryBuilder | knex.Raw): Promise<T> {
    return getQueryResult<Driver, typeof query, Model<Schema>, T>(this, query)
  }

  /**
   * Executes an arbitrary query generated by trilogy's `knex` instance and
   * returns the number of affected rows.
   *
   * @param query Query built with `knex`
   */
  async executeRaw (query: knex.QueryBuilder | knex.Raw): Promise<number> {
    return executeQuery(this, query)
  }

  /**
   * Drains the connection pools and releases connections to any open database
   * files. This should always be called at the end of your program to
   * gracefully shut down, and only once since the connection can't be reopened.
   */
  async close (): Promise<void> {
    if (this.isNative) {
      return this.knex.destroy()
    } else {
      invariant(
        this.pool != null,
        "Invalid connection pool: unexpected null."
      )

      return this.pool.drain()
    }
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
      | [fn: hooks.OnQueryCallback, options?: hooks.OnQueryOptions]
      | [scope: string, fn: hooks.OnQueryCallback, options?: hooks.OnQueryOptions]
  ): Fn<[], boolean> {
    let fn: hooks.OnQueryCallback = () => {}
    let location = ""
    let options: hooks.OnQueryOptions = {
      includeInternal: false
    }

    if (args.length === 1) {
      fn = args[0]
    }

    if (args.length >= 2) {
      if (typeof args[0] === "string") {
        location = args[0]
      } else if (typeof args[1] === "function") {
        fn = args[0]
      }

      if (typeof args[1] === "function") {
        fn = args[1]
      } else {
        options = { ...options, ...args[1] }
      }
    }

    if (args.length === 3) {
      options = args[2] ?? options
    }

    if (location !== "") {
      // all queries run on the model identified by `location`
      return this.getModel(location).onQuery(fn, options)
    }

    // all queries run across all defined models
    const unsubs: Array<Fn<[], boolean>> =
      Array.from(new Array(this.#definitions.size))

    let i = -1
    this.#definitions.forEach(model => {
      unsubs[++i] = model.onQuery(fn, options)
    })

    return (): boolean => unsubs.every(unsub => unsub())
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
  beforeCreate <
    T extends Schema = Schema,
    Props extends ModelProps<T> = ModelProps<T>
  > (
    ...args:
      | [fn: hooks.BeforeCreateCallback<ModelRecord>]
      | [scope: string, fn: hooks.BeforeCreateCallback<Props["objectInput"]>]
  ): Fn<[], boolean> {
    if (args.length === 2) {
      // all creations run on the model identified by `scope`
      const [location, fn] = args
      return this.getModel<T, Props>(location).beforeCreate(fn)
    } else {
      // all creations run across all defined models
      const [fn] = args
      const unsubs: Array<Fn<[], boolean>> =
        Array.from(new Array(this.#definitions.size))

      let i = -1
      this.#definitions.forEach(model => {
        unsubs[++i] = model.beforeCreate(fn)
      })

      return (): boolean => unsubs.every(unsub => unsub())
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
  afterCreate <
    T extends Schema = Schema,
    Props extends ModelProps<T> = ModelProps<T>
  > (
    ...args:
      | [fn: hooks.AfterCreateCallback<ModelRecord>]
      | [scope: string, fn: hooks.AfterCreateCallback<Props["objectOutput"]>]
  ): Fn<[], boolean> {
    if (args.length === 2) {
      // all creations run on the model identified by `scope`
      const [location, fn] = args
      return this.getModel<T, Props>(location).afterCreate(fn)
    } else {
      // all creations run across all defined models
      const [fn] = args
      const unsubs: Array<Fn<[], boolean>> =
        Array.from(new Array(this.#definitions.size))

      let i = -1
      this.#definitions.forEach(model => {
        unsubs[++i] = model.afterCreate(fn)
      })

      return (): boolean => unsubs.every(unsub => unsub())
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
  beforeUpdate <
    T extends Schema = Schema,
    Props extends ModelProps<T> = ModelProps<T>
  > (
    ...args:
      | [fn: hooks.BeforeUpdateCallback<ModelRecord>]
      | [scope: string, fn: hooks.BeforeUpdateCallback<Props["objectInput"]>]
  ): Fn<[], boolean> {
    if (args.length === 2) {
      // all updates run on the model identified by `scope`
      const [location, fn] = args
      return this.getModel<T, Props>(location).beforeUpdate(fn)
    } else {
      // all updates run across all defined models
      const [fn] = args
      const unsubs: Array<Fn<[], boolean>> =
        Array.from(new Array(this.#definitions.size))

      let i = -1
      this.#definitions.forEach((model: Model<SchemaFromShape<ModelRecord>>) => {
        unsubs[++i] = model.beforeUpdate(fn)
      })

      return (): boolean => unsubs.every(unsub => unsub())
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
  afterUpdate <
    T extends Schema = Schema,
    Props extends ModelProps<T> = ModelProps<T>
  > (
    ...args:
      | [fn: hooks.AfterUpdateCallback<ModelRecord>]
      | [scope: string, fn: hooks.AfterUpdateCallback<Props["objectOutput"]>]
  ): Fn<[], boolean> {
    if (args.length === 2) {
      // all updates run on the model identified by `scope`
      const [location, fn] = args
      return this.getModel<T, Props>(location).afterUpdate(fn)
    } else {
      // all updates run across all defined models
      const [fn] = args
      const unsubs: Array<Fn<[], boolean>> =
        Array.from(new Array(this.#definitions.size))

      let i = -1
      this.#definitions.forEach(model => {
        unsubs[++i] = model.afterUpdate(fn)
      })

      return (): boolean => unsubs.every(unsub => unsub())
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
  beforeRemove <
    T extends Schema = Schema,
    Props extends ModelProps<T> = ModelProps<T>
  > (
    ...args:
      | [fn: hooks.BeforeRemoveCallback<ModelRecord>]
      | [scope: string, fn: hooks.BeforeRemoveCallback<Props["objectInput"]>]
  ): Fn<[], boolean> {
    if (args.length === 2) {
      // all removals run on the model identified by `scope`
      const [location, fn] = args
      return this.getModel<T, Props>(location).beforeRemove(fn)
    } else {
      // all removals run across all defined models
      const [fn] = args
      const unsubs: Array<Fn<[], boolean>> =
        Array.from(new Array(this.#definitions.size))

      let i = -1
      this.#definitions.forEach((model: Model<SchemaFromShape<ModelRecord>>) => {
        unsubs[++i] = model.beforeRemove(fn)
      })

      return (): boolean => unsubs.every(unsub => unsub())
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
  afterRemove <
    T extends Schema = Schema,
    Props extends ModelProps<T> = ModelProps<T>
  > (
    ...args:
      | [fn: hooks.AfterRemoveCallback<ModelRecord>]
      | [scope: string, fn: hooks.AfterRemoveCallback<Props["objectOutput"]>]
  ): Fn<[], boolean> {
    if (args.length === 2) {
      // all removals run on the model identified by `scope`
      const [location, fn] = args
      return this.getModel<T, Props>(location).afterRemove(fn)
    } else {
      // all removals run across all defined models
      const [fn] = args
      const unsubs: Array<Fn<[], boolean>> =
        Array.from(new Array(this.#definitions.size))

      let i = -1
      this.#definitions.forEach(model => {
        unsubs[++i] = model.afterRemove(fn)
      })

      return (): boolean => unsubs.every(unsub => unsub())
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
} from "./hooks"

export { Model, ModelWithShape } from "./model"
export * as ColumnType from "./types/column-types"
export * from "./types/schemas"

/**
 * Initialize a new datastore instance, creating a SQLite database file at
 * the provided path if it does not yet exist, or reading it if it does.
 *
 * @param path File path or `':memory:'` for memory-only storage
 * @param options Configuration for this trilogy instance
 */
export const connect = (path: string, options?: TrilogyOptions): Trilogy =>
  new Trilogy(path, options)
