import * as util from './util'
import { castValue } from './types'
import { writeDatabase } from './sqljs-handler'

export function parseResponse (contents) {
  if (!contents || !contents.length) return []

  const { columns, values } = contents[0]
  const results = []

  for (let i = 0; i < values.length; i++) {
    const line = {}

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
    const { length } = order
    if (length === 1 || length === 2) {
      return partial.orderBy(...order)
    }
  }

  return partial
}

export function buildWhere (partial, where, skipDeepValidation) {
  const [
    isValid,
    arrayLength,
    multipleClauses
  ] = isValidWhere(where, skipDeepValidation)

  if (!isValid) return partial

  if (multipleClauses) {
    return where.reduce((accumulator, clause) => {
      return buildWhere(accumulator, clause, true)
    }, partial)
  }

  let cast = where
  if (!arrayLength) {
    cast = util.map(where, castValue)
  } else {
    const i = arrayLength - 1
    cast[i] = castValue(where[i])
  }

  if (!arrayLength) return partial.where(cast)
  return partial.where(...cast)
}

export function isWhereArrayLike (where) {
  if (!where) return false

  const { length } = where
  return (
    util.isArray(where) &&
    (length === 2 || length === 3) &&
    typeof where[0] === 'string'
  )
}

export function isValidWhere (where, skipDeepValidation) {
  if (isWhereArrayLike(where)) return [true, where.length]

  if (util.isArray(where)) {
    if (!skipDeepValidation) {
      return [where.every(isValidWhere), null, true]
    } else {
      return [true, null, true]
    }
  }

  if (util.isObject(where)) return [true]

  return [false]
}

export function runQuery (instance, query, needResponse) {
  const asString = query.toString()
  const action = getQueryAction(asString)
  if (util.isFunction(instance.verbose)) {
    instance.verbose(asString)
  }

  if (instance.isNative) {
    if (needResponse) return query
    return query.then(res => {
      if (util.isNumber(res)) return res
      return res ? res.length : 0
    })
  }

  return instance.pool.acquire().then(db => {
    let response

    if (needResponse) {
      response = parseResponse(db.exec(asString))
      if (query._sequence && query._sequence[0].method === 'hasTable') {
        response = !!response.length
      }
    } else {
      db.run(asString)

      if (util.isOneOf(['insert', 'update', 'delete'], action)) {
        response = db.getRowsModified()
      }
    }

    writeDatabase(instance, db)
    instance.pool.release(db)
    return response
  })
}

export function findLastObject (model, object) {
  const { key, hasIncrements } = findKey(model.schema)

  if (!key && !hasIncrements) return

  const query = hasIncrements
    ? model.ctx.knex('sqlite_sequence').first('seq').where({ name: model.name })
    : model.ctx.knex(model.name).first().where({ [key]: object[key] })

  return runQuery(model.ctx, query, true).then(res => {
    res = model.ctx.isNative ? res : res[0]
    return hasIncrements ? model.findOne({ [key]: res.seq }) : res
  })
}

function findKey (schema) {
  let key = ''
  let hasIncrements = false
  for (const name in schema) {
    if (!schema.hasOwnProperty(name)) continue
    let props = schema[name]
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

function getQueryAction (str) {
  return str.split(' ', 1)[0].toLowerCase()
}
