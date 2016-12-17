import { map, each, isBoolean, isFunction, isObject, isString } from './util'

export let coercion = { active: true }

export function parseResponse (contents) {
  if (contents.length) {
    let columns = contents[0].columns
    let values = contents[0].values
    let results = []
    for (let i = 0; i < values.length; i++) {
      let line = {}
      for (let j = 0; j < columns.length; j++) {
        line[columns[j]] = coercion.active
          ? stringToBoolean(values[i][j])
          : values[i][j]
      }
      results.push(line)
    }
    return results
  } else {
    return []
  }
}

// parse a dot or bracket notated string into table, column, & row
// the row value isn't actually used currently
export function parseTablePath (table, column, row) {
  if (table.includes('.')) {
    let [top, inner, nested] = table.split('.')
    return parseTablePath(top, inner, nested)
  } else if (table.includes('[')) {
    let opener = table.indexOf('[')
    let closer = table.indexOf(']', opener)

    let top = table.substr(0, opener)
    let inner = table.slice(opener + 1, closer)

    let rowIndex = top.length + inner.length + 2

    let extra, nested
    if (rowIndex < table.length) {
      extra = table.slice(rowIndex + 1)
      let rowCloser = extra.indexOf(']')
      nested = extra.substr(0, rowCloser)
    }

    return parseTablePath(top, inner, nested)
  } else {
    return [table, column, row]
  }
}

export function sanitizeOrder (order, partial) {
  if (Array.isArray(order) && order.length === 2) {
    return partial.orderBy(...order)
  } else if (isString(order)) {
    return partial.orderBy(order)
  } else {
    return partial
  }
}

export function sanitizeWhere (where, partial) {
  if (Array.isArray(where)) {
    let arr = coercion.active
      ? where.map(booleanToString) : where
    return partial.where(...arr)
  } else if (isFunction(where)) {
    return partial.where(where.bind(partial))
  } else {
    // it's an object
    return partial.where(map(where, v => {
      return coercion.active ? booleanToString(v) : v
    }))
  }
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

export function sanitizeColumns (columns) {
  if (Array.isArray(columns)) return columns
  if (isString(columns)) return [columns]
  return ['*']
}

export function isValidWhere (where) {
  if (isObject(where)) return true

  if (Array.isArray(where)) {
    let len = where.length
    return len === 2 || len === 3
  }

  return false
}

export function processColumn (table, column) {
  if (!column.name) {
    throw new Error('column name required')
  }

  let { name, type = 'text' } = column

  if (column.unique === 'inline') {
    // bypass knex's usual unique method
    column['__TYPE__'] = `${type} unique`
    type = 'specificType'
    delete column.unique
  }

  let partial = table[type](name, column['__TYPE__'])

  mapColumnProperties(partial, column)
}

export function processArraySchema (table, columns) {
  each(columns, column => {
    if (isString(column)) {
      table.text(column)
      return
    }

    if (isObject(column)) {
      processColumn(table, column)
    }
  })
}

export function processObjectSchema (table, columns) {
  each(columns, (value, name) => {
    if (isString(value) && isFunction(table[value])) {
      table[value](name)
    } else if (isObject(value)) {
      let column = Object.assign({}, { name }, value)
      processColumn(table, column)
    }
  })
}

export function mapColumnProperties (partial, column) {
  return Object.keys(column).reduce((acc, key) => {
    // name & type are handled already
    if (key === 'name' || key === 'type') return acc

    let value = column[key]
    let method = acc[key]

    if (typeof method !== 'function') {
      return
    }

    return value === undefined
      ? method.call(acc)
      : method.call(acc, value)
  }, partial)
}

export function stringToBoolean (value) {
  if (value !== 'true' && value !== 'false') return value
  return value === 'true'
}

export function booleanToString (value) {
  return isBoolean ? `${value}` : value
}
