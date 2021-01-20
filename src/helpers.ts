import { Driver } from "./constants"
import { castValue } from "./schema-helpers"
import { writeDatabase } from "./sqljs-handler"
import * as util from "./util"

import * as knex from "knex"

import { Trilogy } from "."
import { Hook, OnQueryContext } from "./hooks"
import * as types from "./types"

const HasTableSubstring = "from sqlite_master where type = 'table'"

export const parseResponse = (
  contents: types.SqlJsResponse
): types.LooseObject[] => {
  if (contents?.length < 1) return []

  const [{ columns, values }] = contents
  const results = []

  for (let i = 0; i < values.length; i++) {
    const line: types.LooseObject = {}

    for (let j = 0; j < columns.length; j++) {
      line[columns[j]] = values[i][j]
    }

    results.push(line)
  }

  return results
}

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
      return partial.orderBy(order[0], order[1])
    }
  }

  return partial
}

export const buildWhere = <T = any, U = any> (
  partial: knex.QueryBuilder<T, U>,
  where: types.CriteriaBase | types.CriteriaList | undefined,
  inner?: boolean
): knex.QueryBuilder<T, U> => {
  if (where === undefined) return partial

  if (isWhereTuple(where)) {
    const i = where.length - 1
    const cast = where
    cast[i] = castValue(where[i])

    if (cast.length === 2) {
      return partial.where(...cast)
    } else if (cast.length === 3) {
      return partial.where(...cast)
    }
  }

  if (inner == null && isWhereMultiple(where)) {
    return where.reduce<knex.QueryBuilder<T, U>>((accumulator, clause) => {
      return buildWhere(accumulator, clause, true)
    }, partial)
  }

  if (!Array.isArray(where)) {
    const criteria = util.mapObj(where, castValue)
    return partial.where(criteria)
  }

  util.invariant(false, `invalid where clause type: '${typeof where}'`)
}

export const isWhereTuple = (
  where: any
): where is types.Criteria2 | types.Criteria3 => {
  return (
    Array.isArray(where) &&
    (where.length === 2 || where.length === 3) &&
    typeof where[0] === "string"
  )
}

export const isWhereMultiple = (where: any): where is types.CriteriaList => {
  return (
    Array.isArray(where) &&
    where.every(item => isWhereTuple(item) || util.isObject(item))
  )
}

export const isValidWhere = (where: any): where is types.CriteriaBase => {
  return (
    isWhereTuple(where) ||
    util.isObject(where) ||
    isWhereMultiple(where)
  )
}

export function normalizeCriteria <D> (
  where: types.CriteriaObj<D> | types.Criteria2<D>
): types.CriteriaObj<D>
export function normalizeCriteria <D> (
  where: types.Criteria3<D>
): types.Criteria3<D>
export function normalizeCriteria <D> (
  where: types.CriteriaList<D>
): types.CriteriaListNormalized<D>
export function normalizeCriteria <D> (
  where: types.CriteriaBase<D>
): types.CriteriaBaseNormalized<D>
export function normalizeCriteria <D> (
  where: types.Criteria<D>
): types.CriteriaNormalized<D>
export function normalizeCriteria <D> (
  where: unknown
): unknown {
  if (isWhereTuple(where)) {
    return (
      where.length === 2
        ? { [where[0]]: where[1] }
        : where
    )
  }

  if (isWhereMultiple(where)) {
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
  Props extends types.ModelProps<types.Schema>
> (
  instance: Trilogy,
  query: types.Query,
  options: types.QueryOptions<Props> = {}
): Promise<types.Query | number | boolean | unknown[]> => {
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
  Props extends types.ModelProps<types.Schema> = types.ModelProps<types.Schema>,
  Options extends Omit<types.QueryOptions<Props>, "needResponse"> = Omit<types.QueryOptions<Props>, "needResponse">
> (
  instance: Trilogy,
  query: types.Query,
  options: Options = {} as Options
): Promise<number> => {
  return runQuery(instance, query, {
    ...options,
    needResponse: false
  })
}

export const getQueryResult = async <
  DriverType extends Driver,
  Query extends types.QueryLike = types.Query,
  Props extends types.ModelProps<types.Schema> = types.ModelProps<types.Schema>,
  R = types.QueryResult<DriverType, Query>,
  Options extends Omit<types.QueryOptions<Props>, "needResponse"> = Omit<types.QueryOptions<Props>, "needResponse">
> (
  instance: Trilogy,
  query: Query,
  options: Options = {} as Options
): Promise<R> => {
  return runQuery(instance, query as types.Query, {
    ...options,
    needResponse: true
  })
}

export const findKey = (schema: types.SchemaNormalized<any>): {
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
