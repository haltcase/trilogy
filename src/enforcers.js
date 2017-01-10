import osom from 'osom'
import * as util from './util'

function Any (value) { return value }

function toArray (value) {
  if (typeof value === 'undefined') return
  return util.isArray(value) ? value : [value]
}

export let setup = osom({
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
      return util.isObject(value)
    }
  },
  verbose: {
    type: Any
  }
})

export let modelOptions = osom({
  timestamps: Boolean,
  primary: Array,
  unique: Array
})

export let findOptions = osom({
  order: Any,
  limit: Number,
  skip: Number
})

export let aggregateOptions = osom({
  order: Any,
  groupBy: {
    type: Any,
    transform: [toArray]
  }
})

export let columnDescriptor = osom({
  type: {
    type: Any,
    required: true,
    validate (value) {
      return util.isOneOf([
        'increments', 'json', 'timestamp',
        String, Number, Boolean, Date
      ], value)
    }
  },
  defaultTo: Any,
  unique: Boolean,
  primary: Boolean,
  nullable: Boolean,
  notNullable: Boolean,
  index: String
})
