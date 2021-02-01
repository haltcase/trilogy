import * as knex from "knex"

import { Driver } from "./constants"
import { castValue } from "./schema-helpers"
import { parseResponse, writeDatabase } from "./sqljs-handler"
import * as util from "./util"

import { Trilogy } from "."
import { Model } from "./model"
import { Hook, OnQueryContext } from "./hooks"

import {
  Criteria,
  WhereEqual,
  WhereList,
  WhereListNormalized,
  WhereObject,
  WhereOperator,
  WhereNormalized,
  WhereTuple
} from "./types/criteria"

import { Query, QueryLike, QueryOptions, QueryResult } from "./types/queries"
import { ModelRecord, ResolveModelSchema, Schema } from "./types/schemas"
import { Const, Nullable } from "./types/utils"

const HasTableSubstring = "from sqlite_master where type = 'table'"

export const buildOrder = <T = any, U = any> (
  partial: knex.QueryBuilder<T, U>,
  order: string | [string] | [string, string]
): knex.QueryBuilder<T, U> => {
  if (util.isString(order)) {
    if (order === "random") {
      return partial.orderByRaw("RANDOM()")
    }
    return partial.orderBy(order)
  }

  if (Array.isArray(order)) {
    if (order.length === 1) {
      return partial.orderBy(order[0])
    } else if (order.length === 2) {
      return partial.orderBy(...order)
    }
  }

  return partial
}

export const buildWhere = <T extends ModelRecord = ModelRecord> (
  partial: knex.QueryBuilder<any, any>,
  where: Nullable<Criteria<T>>,
  inner?: boolean
): knex.QueryBuilder<any, any> => {
  if (where == null) {
    return partial
  }

  if (isWhereTuple(where)) {
    const i = where.length - 1
    const cast = where
    ;(cast[i] as any) = castValue(where[i])

    if (cast.length === 2) {
      return partial.where(...cast as [any, any])
    } else if (cast.length === 3) {
      return partial.where(...cast as [any, any, any])
    }
  }

  if (inner == null && isWhereList(where)) {
    return where.reduce<knex.QueryBuilder<any, any>>((accumulator, clause) => {
      return buildWhere(accumulator, clause, true)
    }, partial)
  }

  if (!Array.isArray(where)) {
    const criteria = util.mapObj(where, castValue)
    return partial.where(criteria)
  }

  util.invariant(false, `invalid where clause type: '${typeof where}'`)
}

export function isWhereTupleImpl <T> (length: 2): (where: any) => where is WhereEqual<any>
export function isWhereTupleImpl <T> (length: 3): (where: any) => where is WhereOperator<any>
export function isWhereTupleImpl <T extends WhereTuple<any>> (length: 2 | 3): (where: any) => where is T {
  return (where: any): where is T =>
    Array.isArray(where) &&
    where.length === length &&
    typeof where[0] === "string"
}

export const isWhereEqual = isWhereTupleImpl(2)
export const isWhereOperator = isWhereTupleImpl(3)

export const isWhereTuple = (where: any): where is WhereTuple<any> =>
  isWhereEqual(where) || isWhereOperator(where)

export const isWhereList = (where: any): where is WhereList<any> => {
  return (
    Array.isArray(where) &&
    where.every(item => isWhereTuple(item) || util.isObject(item))
  )
}

export const isWhereListNormalized = (where: any): where is WhereListNormalized<any> => {
  return (
    Array.isArray(where) &&
    where.every(item => (isWhereTuple(item) && item.length == 2) || util.isObject(item))
  )
}

export const isValidCriteria = (where: any): where is Criteria<ModelRecord> => {
  return (
    isWhereTuple(where) ||
    util.isObject(where) ||
    isWhereList(where)
  )
}

export function normalizeCriteria (
  where: null | undefined
): null
export function normalizeCriteria <T extends ModelRecord> (
  where: WhereObject<T> | WhereEqual<T>
): WhereObject<T>
export function normalizeCriteria <T extends ModelRecord> (
  where: WhereOperator<T>
): WhereOperator<T>
export function normalizeCriteria <T extends ModelRecord> (
  where: WhereList<T>
): WhereListNormalized<T>
export function normalizeCriteria <T extends ModelRecord> (
  where: Criteria<T>
): WhereNormalized<T>
export function normalizeCriteria <_ extends ModelRecord, WhereType> (
  where: Nullable<Const<WhereType>>
): unknown {
  if (where == null) {
    return null
  }

  if (isWhereTuple(where)) {
    return (
      where.length === 2
        ? { [where[0]]: where[1] }
        : where
    )
  }

  if (isWhereList(where)) {
    return where.map(rule => normalizeCriteria(rule))
  }

  if (util.isObject(where)) {
    return where
  }

  util.invariant(false, `invalid criteria: ${String(where)}`)
}

const getQueryAction = (str: string): string => {
  return str.split(" ", 1)[0].toLowerCase()
}

const runQuery = async <
  QueryModel extends Model<Schema>
> (
  instance: Trilogy,
  query: Query,
  options: QueryOptions<QueryModel> = {}
): Promise<Query | number | boolean | unknown[]> => {
  const {
    bindings,
    sql: sqlString
  } = util.firstOrValue(query.toSQL())

  if (options.model != null) {
    await options.model._callHook(
      Hook.OnQuery,
      [sqlString, options.internal ?? false] as OnQueryContext
    )
  }

  if (instance.isNative) {
    if (options.needResponse ?? false) {
      return query
    }

    const result = await query
    return util.isNumber(result)
      ? result
      : result?.length ?? 0
  }

  util.invariant(
    instance.pool != null,
    "Invalid connection pool: unexpected null."
  )

  const db = await instance.pool.acquire()
  const action = getQueryAction(sqlString)
  let response

  if (options.needResponse ?? false) {
    // TODO: execute the query more securely?
    response = parseResponse(db.exec(query.toQuery()))
    if (sqlString.toLowerCase().includes(HasTableSubstring)) {
      response = Boolean(response.length)
    }
  } else {
    db.run(sqlString, bindings.map(castValue))

    if (["insert", "update", "delete"].includes(action)) {
      response = db.getRowsModified()
    }
  }

  writeDatabase(instance, db)
  void instance.pool.release(db)
  return response
}

export const executeQuery = async <
  QueryModel extends Model<any, any> = Model<Schema>,
  Options extends Omit<QueryOptions<QueryModel>, "needResponse"> = Omit<QueryOptions<QueryModel>, "needResponse">
> (
  instance: Trilogy,
  query: Query,
  options: Options = {} as Options
): Promise<number> => {
  return runQuery(instance, query, {
    ...options,
    needResponse: false
  })
}

export const getQueryResult = async <
  DriverType extends Driver,
  Q extends QueryLike = Query,
  QueryModel extends Model<any, any> = Model<Schema>,
  R = QueryResult<DriverType, Query>,
  Options extends Omit<QueryOptions<QueryModel>, "needResponse"> = Omit<QueryOptions<QueryModel>, "needResponse">
> (
  instance: Trilogy,
  query: Q,
  options: Options = {} as Options
): Promise<R> => {
  return runQuery(instance, query as Query, {
    ...options,
    needResponse: true
  })
}

export const findKey = (schema: ResolveModelSchema<any>): {
  key: string
  hasIncrements: boolean
} => {
  let key = ""
  let hasIncrements = false

  const keys = Object.keys(schema)
  for (const name of keys) {
    const {
      type,
      primary = false,
      unique = false
    } = schema[name]

    if (type === "increments") {
      key = name
      hasIncrements = true
      break
    } else if (primary || unique) {
      key = name
    }
  }

  return { key, hasIncrements }
}
