import * as util from './util'
import { castValue } from './types'
import { writeDatabase } from './sqljs-handler'

export function parseResponse (contents) {
  if (!contents || !contents.length) return []

  let { columns, values } = contents[0]
  let results = []

  for (let i = 0; i < values.length; i++) {
    let line = {}

    for (let j = 0; j < columns.length; j++) {
      line[columns[j]] = values[i][j]
    }

    results.push(line)
  }

  return results
}

export function buildOrder (partial, order) {
  if (util.isString(order)) {
    if (order === 'random') {
      return partial.orderByRaw('RANDOM()')
    }
    return partial.orderBy(order)
  }

  if (util.isArray(order)) {
    let length = order.length
    if (length === 1 || length === 2) {
      return partial.orderBy(...order)
    }
  }

  return partial
}

export function buildWhere (partial, where) {
  let [isValid, arrayLength] = isValidWhere(where)
  if (!isValid) return partial

  let cast = where
  if (!arrayLength) {
    cast = util.map(where, castValue)
  } else {
    let i = arrayLength - 1
    cast[i] = castValue(where[i])
  }

  if (!arrayLength) return partial.where(cast)
  return partial.where(...cast)
}

export function isValidWhere (where) {
  if (util.isObject(where)) return [true]

  if (util.isArray(where)) {
    let len = where.length
    return [len === 2 || len === 3, len]
  }

  return [false]
}

export function getConflictString (conflict) {
  switch (conflict.toLowerCase()) {
    case 'fail': return ' or fail '
    case 'abort': return ' or abort '
    case 'ignore': return ' or ignore '
    case 'replace': return ' or replace '
    case 'rollback': return ' or rollback '
    default: return ' '
  }
}

export function runQuery (instance, query, needResponse) {
  if (util.isFunction(instance.verbose)) {
    instance.verbose(query.toString())
  }

  if (instance.isNative) return query

  let response

  if (needResponse) {
    response = parseResponse(instance.db.exec(query.toString()))
    if (query._sequence && query._sequence[0].method === 'hasTable') {
      return !!response.length
    }
  } else {
    instance.db.run(query.toString())

    if (util.isOneOf(['insert', 'update', 'delete'], query._method)) {
      response = instance.db.getRowsModified()
    }
  }

  writeDatabase(instance)
  return Promise.resolve(response)
}
