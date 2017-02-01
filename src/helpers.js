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
  if (util.isArray(where)) {
    let len = where.length
    return [len === 2 || len === 3, len]
  }

  if (util.isObject(where)) return [true]

  return [false]
}

export function runQuery ({ instance, name, query, needResponse }) {
  if (util.isFunction(instance.verbose)) {
    instance.verbose(query.toString())
  }

  if (instance.isNative) {
    if (name && /^insert/i.test(query.toString())) {
      return query.then(function (res) {
        return findLastObject(instance, name)
          .then(obj => obj || {})
          .catch(err => console.error(err))
      })
    } else {
      if (needResponse) return query
      return query.then(res => {
        if (util.isNumber(res)) return res
        return res ? res.length : 0
      })
    }
  }

  return instance.pool.acquire().then(db => {
    let response

    if (needResponse) {
      response = parseResponse(db.exec(query.toString()))
      if (query._sequence && query._sequence[0].method === 'hasTable') {
        response = !!response.length
      }
    } else {
      db.run(query.toString())

      if (util.isOneOf(['insert', 'update', 'delete'], query._method)) {
        response = db.getRowsModified()
      }
    }

    writeDatabase(instance, db)
    instance.pool.release(db)
    return response
  })
}

export function findLastObject (instance, table) {
  return new Promise((resolve, reject) => {
    let queryInfo = `PRAGMA table_info("${table}")`
    let queryId = `SELECT seq FROM sqlite_sequence WHERE name="${table}"`

    instance.knex.raw(queryInfo).then(info => {
      // find the name of PK
      let key
      info.some(each => {
        if (each.pk && each.notnull && each.type === 'integer') {
          key = each.name
          return true
        }
      })

      !key && resolve(null)
      instance.knex.raw(queryId)
        .then(res => {
          let obj = {}
          obj[key] = res[0].seq
          resolve(instance.findOne(table, obj))
        })
        .catch(err => reject(err))
    }).catch(err => reject(err))
  })
}
