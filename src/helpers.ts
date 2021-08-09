import { castValue } from './schema-helpers'
import { writeDatabase } from './sqljs-handler'
import * as util from './util'

import * as knex from 'knex'

import { Trilogy } from '.'
import { Hook, OnQueryContext } from './hooks'
import * as types from './types'

const HasTableSubstring = "from sqlite_master where type = 'table'"

export const parseResponse = (
  contents: types.SqlJsResponse
): types.LooseObject[] => {
  if (!contents || !contents.length) return []

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
    if (order === 'random') {
      return partial.orderByRaw('RANDOM()')
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

  if (!inner && isWhereMultiple(where)) {
    return where.reduce<knex.QueryBuilder<T, U>>((accumulator, clause) => {
      return buildWhere(accumulator, clause, true)
    }, partial)
  }

  if (util.isObject(where)) {
    return partial.where(util.mapObj(where, castValue))
  }

  util.invariant(false, `invalid where clause type: '${typeof where}'`)
}

export const isWhereTuple = (
  where: any
): where is types.Criteria2 | types.Criteria3 => {
  return (
    Array.isArray(where) &&
    (where.length === 2 || where.length === 3) &&
    typeof where[0] === 'string'
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

  util.invariant(false, `invalid criteria: ${where}`)
}

const getQueryAction = (str: string): string => {
  return str.split(' ', 1)[0].toLowerCase()
}

export const runQuery = async <D extends types.ReturnDict = types.LooseObject> (
  instance: Trilogy,
  query: types.Query,
  options: types.QueryOptions<D> = {}
): Promise<any> => {
  const asString = query.toString()
  const action = getQueryAction(asString)

  if (options.model) {
    await options.model._callHook(
      Hook.OnQuery,
      [asString, options.internal] as OnQueryContext
    )
  }

  if (instance.isNative) {
    if (options.needResponse) return query

    const res = await query
    if (util.isNumber(res)) return res
    return res?.length ?? 0
  }

  // tslint:disable-next-line:await-promise
  const db = await instance.pool!.acquire()
  let response

  if (options.needResponse) {
    response = parseResponse(db.exec(asString))
    if (asString.toLowerCase().includes(HasTableSubstring)) {
      response = Boolean(response.length)
    }
  } else {
    db.run(asString)

    if (['insert', 'update', 'delete'].includes(action)) {
      response = db.getRowsModified()
    }
  }

  writeDatabase(instance, db)
  instance.pool!.release(db)
  return response
}

export const findKey = (schema: types.Schema) => {
  let key = ''
  let hasIncrements = false

  const keys = Object.keys(schema)
  for (const name of keys) {
    const props = schema[name]
    if (props === 'increments' || props.type === 'increments') {
      key = name
      hasIncrements = true
      break
    } else if (props.primary || props.unique) {
      key = name
    }
  }

  return { key, hasIncrements }
}
