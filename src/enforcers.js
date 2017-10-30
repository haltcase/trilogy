import osom from 'osom'
import { COLUMN_TYPES } from './constants'

import {
  isArray,
  isFunction,
  isObject,
  isOneOf
} from './util'

function Any (value) { return value }

function toArray (value) {
  if (typeof value === 'undefined') return
  return isArray(value) ? value : [value]
}

function isValidIndex (value, top) {
  if (
    typeof value === 'string' || (
      isArray(value) && value.every(item => {
        return top ? isValidIndex(item) : typeof item === 'string'
      })
    )
  ) {
    return true
  }

  if (!top) return false

  if (isObject(value)) {
    for (const prop of Object.keys(value)) {
      if (!isValidIndex(value[prop])) return false
    }
  }

  return true
}

export const setup = osom({
  client: {
    type: String,
    default: 'sqlite3',
    validate (value) {
      return value === 'sqlite3' || value === 'sql.js'
    }
  },
  dir: {
    type: String,
    default: process.cwd
  },
  connection: {
    type: Object,
    default: {},
    validate (value) {
      return isObject(value)
    }
  },
  verbose: {
    type: Any
  }
})

export const modelOptions = osom({
  timestamps: Boolean,
  primary: Array,
  unique: Array,
  index: {
    type: Any,
    validate (value) {
      return isValidIndex(value, true)
    }
  }
})

export const findOptions = osom({
  order: Any,
  limit: Number,
  skip: Number,
  raw: Boolean
})

export const aggregateOptions = osom({
  order: Any,
  groupBy: {
    type: Any,
    transform: [toArray]
  }
})

export const columnDescriptor = osom({
  type: {
    type: Any,
    required: true,
    validate (value) {
      const type = isFunction(value) ? value.name : String(value)
      return isOneOf(COLUMN_TYPES, type.toLowerCase())
    }
  },
  defaultTo: Any,
  unique: Boolean,
  primary: Boolean,
  nullable: Boolean,
  notNullable: Boolean,
  index: String,
  getter: Function,
  setter: Function
})
