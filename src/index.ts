import { dirname, resolve } from 'path'
import { openSync, closeSync } from 'fs'

import * as knex from 'knex'

import Model from './model'
import { runQuery } from './helpers'
import { toKnexSchema, createTimestampTrigger } from './schema-helpers'
import { pureConnect } from './sqljs-handler'
import { defaultTo, invariant, makeDirPath } from './util'

import { Pool } from 'generic-pool'
import { SqlJs } from 'sql.js/module'
import * as hooks from './hooks'
import * as types from './types'

// @ts-ignore: throwaway reference to satisfy compiler
import * as t from 'io-ts'

const ensureExists = (atPath: string) => {
  try {
    closeSync(openSync(atPath, 'wx'))
  } catch {}
}

export class Trilogy {
  isNative: boolean
  knex: knex
  options: types.TrilogyOptions
  pool?: Pool<SqlJs.Database>
  verbose?: (query: string) => any

  private _definitions: Map<string, Model<any>>

  constructor (path: string, options: types.TrilogyOptions = {}) {
    invariant(path, 'trilogy constructor must be provided a file path')

    const obj = this.options =
      types.validate(options, types.TrilogyOptions)

    if (path === ':memory:') {
      obj.connection!.filename = path
    } else {
      obj.connection!.filename = resolve(obj.dir as string, path)

      // ensure the directory exists
      makeDirPath(dirname(obj.connection!.filename))
    }

    this.isNative = obj.client === 'sqlite3'

    const config = { client: 'sqlite3', useNullAsDefault: true }

    if (path !== ':memory:') {
      ensureExists(obj.connection!.filename)
    }

    if (this.isNative) {
      this.knex = knex(({ ...config, connection: obj.connection } as knex.Config))
    } else {
      this.knex = knex(config)
      this.pool = pureConnect(this)
    }

    this._definitions = new Map()
  }

  get models () {
    return [...this._definitions.keys()]
  }

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
      types.validate(options, types.ModelOptions, {})
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

    // tslint:disable-next-line:no-floating-promises
    createTimestampTrigger(model)
    return model
  }

  getModel <D extends types.ReturnDict = types.LooseObject> (name: string): Model<D> | never {
    return invariant(
      this._definitions.get(name) as Model<D>,
      `no model defined by the name '${name}'`
    )
  }

  async hasModel (name: string): Promise<boolean> {
    if (!this._definitions.has(name)) {
      return false
    }

    const query = this.knex.schema.hasTable(name)
    return runQuery(this, query, { needResponse: true })
  }

  async dropModel (name: string): Promise<boolean> {
    if (!this._definitions.has(name)) {
      return false
    }

    const query = this.knex.schema.dropTableIfExists(name)
    await runQuery(this, query, { needResponse: true })
    this._definitions.delete(name)
    return true
  }

  raw (query: knex.QueryBuilder | knex.Raw, needResponse?: boolean) {
    return runQuery(this, query, { needResponse })
  }

  close () {
    if (this.isNative) {
      // must wrap this return value in native Promise due to
      // https://github.com/petkaantonov/bluebird/issues/1277
      return Promise.resolve(this.knex.destroy())
    } else {
      return this.pool!.drain()
    }
  }

  create <T = types.LooseObject> (
    table: string,
    object: types.LooseObject,
    options?: types.LooseObject
  ): Promise<T>
  create (
    table: string,
    object: types.LooseObject,
    options?: types.LooseObject
  ) {
    const model = this.getModel(table)
    return model.create(object, options)
  }

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

  findOrCreate <T = types.LooseObject> (
    table: string,
    criteria: types.Criteria,
    creation?: types.LooseObject,
    options?: types.FindOptions
  ): Promise<T>
  findOrCreate (
    table: string,
    criteria: types.Criteria,
    creation?: types.LooseObject,
    options?: types.FindOptions
  ) {
    const model = this.getModel(table)
    return model.findOrCreate(criteria, creation, options)
  }

  update (
    table: string,
    criteria: types.Criteria,
    data: types.LooseObject,
    options?: types.UpdateOptions
  ) {
    const model = this.getModel(table)
    return model.update(criteria, data, options)
  }

  updateOrCreate (
    table: string,
    criteria: types.Criteria,
    data: types.LooseObject,
    options?: types.CreateOptions & types.UpdateOptions
  ) {
    const model = this.getModel(table)
    return model.updateOrCreate(criteria, data, options)
  }

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
    const model = this.getModel(table)
    return model.get(column, criteria, defaultValue)
  }

  set <T> (location: string, criteria: types.Criteria, value: T) {
    const [table, column] = location.split('.', 2)
    const model = this.getModel(table)
    return model.set(column, criteria, value)
  }

  getRaw <T> (location: string, criteria: types.Criteria, defaultValue: T): Promise<T>
  getRaw (location: string, criteria: types.Criteria): Promise<types.ReturnType>
  getRaw (
    location: string,
    criteria: types.Criteria,
    defaultValue?: any
  ): Promise<any> {
    const [table, column] = location.split('.', 2)
    const model = this.getModel(table)
    return model.getRaw(column, criteria, defaultValue)
  }

  setRaw <T> (location: string, criteria: types.Criteria, value: T) {
    const [table, column] = location.split('.', 2)
    const model = this.getModel(table)
    return model.setRaw(column, criteria, value)
  }

  increment (location: string, criteria: types.Criteria, amount?: number) {
    const [table, column] = location.split('.', 2)
    const model = this.getModel(table)
    return model.increment(column, criteria, amount)
  }

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

  remove (location: string, criteria: types.Criteria) {
    const model = this.getModel(location)
    return model.remove(criteria)
  }

  clear (location: string) {
    const model = this.getModel(location)
    return model.clear()
  }

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

    const [table, column] = defaultTo(location, '').split('.', 2)
    const model = this.getModel(table)
    return column
      ? model.countIn(column, criteria, options)
      : model.count(criteria, options)
  }

  min (location: string, criteria: types.Criteria, options?: types.AggregateOptions) {
    const [table, column] = location.split('.', 2)
    const model = this.getModel(table)
    return model.min(column, criteria, options)
  }

  max (location: string, criteria: types.Criteria, options?: types.AggregateOptions) {
    const [table, column] = location.split('.', 2)
    const model = this.getModel(table)
    return model.max(column, criteria, options)
  }

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

export { default as Model } from './model'
export * from './types'

export const connect = (path: string, options?: types.TrilogyOptions) =>
  new Trilogy(path, options)
