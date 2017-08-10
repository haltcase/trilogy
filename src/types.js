import * as util from './util'
import { isWhereArrayLike } from './helpers'
import { columnDescriptor } from './enforcers'
import { KNEX_NO_ARGS, COLUMN_TYPES, IGNORABLE_PROPS } from './constants'

export function toKnexSchema (model, options) {
  return function (table) {
    // every property of `model.schema` is a column
    util.each(model.schema, (descriptor, name) => {
      // each column's value is either its type or a descriptor
      const type = getDataType(descriptor)
      const partial = table[toKnexMethod(type)](name)

      if (util.isFunction(descriptor) || !util.isObject(descriptor)) return

      const columnProperties = columnDescriptor(descriptor)
      util.each(columnProperties, (value, property) => {
        if (util.isOneOf(IGNORABLE_PROPS, property)) return

        if (util.isOneOf(KNEX_NO_ARGS, property)) {
          columnProperties[property] && partial[property]()
        } else {
          partial[property](value)
        }
      })
    })

    util.each(options, (value, key) => {
      if (key === 'timestamps') {
        options.timestamps && table.timestamps(true, true)
      } else {
        table[key](value)
      }
    })
  }
}

// for insertions / updates
export function toDefinition (model, object, options) {
  if (isWhereArrayLike(object)) {
    return toColumnDefinition(model, object[0], object[2], options)
  }

  if (util.isArray(object)) {
    return util.map(object, clause => {
      return toDefinition(model, clause, options)
    })
  }

  return util.map(object, (value, column) => {
    return toColumnDefinition(model, column, value, options)
  })
}

// for selects
export function fromDefinition (model, object, options) {
  return util.map(object, (value, column) => {
    return fromColumnDefinition(model, column, value, options)
  })
}

// for insertions / updates
export function toColumnDefinition (model, column, value, options = {}) {
  const definition = model.schema[column]
  const type = getDataType(definition)
  const cast = toInputType(type, value)

  if (!options.raw && util.isFunction(definition.set)) {
    return castValue(definition.set(cast))
  }

  return cast
}

// for selects
export function fromColumnDefinition (model, column, value, options) {
  const definition = model.schema[column]
  const type = getDataType(definition)
  const cast = toReturnType(type, value)

  if (!options.raw && util.isFunction(definition.get)) {
    return definition.get(cast)
  }

  return cast
}

export function castValue (value) {
  const type = util.isType(value)
  if (type === 'number' || type === 'string') {
    return value
  }

  if (type === 'boolean') return Number(value)

  if (type === 'array' || type === 'object') {
    return JSON.stringify(value)
  }

  return value
}

export function normalizeSchema (schema) {
  return util.map(schema, descriptor => {
    const type = util.isType(descriptor)
    if (type === 'function' || type === 'string') {
      return { type: descriptor }
    }

    return descriptor
  })
}

function getDataType (property) {
  let type = property

  if (util.isFunction(property)) {
    type = property.name
  } else if (util.isObject(property)) {
    type = util.isFunction(property.type)
      ? property.type.name
      : property.type
  }

  if (util.isString(type)) {
    type = type.toLowerCase()
  }

  if (!util.isOneOf(COLUMN_TYPES, type)) {
    type = 'string'
  }

  return type
}

function toKnexMethod (type) {
  switch (type) {
    case 'string':
    case 'array':
    case 'object':
    case 'json':
      return 'text'
    case 'number':
    case 'boolean':
      return 'integer'
    case 'date':
      return 'dateTime'
    case 'increments':
    default:
      return type
  }
}

function toInputType (type, value) {
  switch (type) {
    case 'string':
      return String(value)
    case 'array':
    case 'object':
    case 'json':
      return JSON.stringify(value)
    case 'number':
    case 'boolean':
    case 'increments':
      return Number(value)
    case 'date':
      return new Date(value)
    default:
      return value
  }
}

function toReturnType (type, value) {
  switch (type) {
    case 'string':
      return String(value)
    case 'array':
    case 'object':
    case 'json':
      return JSON.parse(value)
    case 'number':
    case 'increments':
      return Number(value)
    case 'boolean':
      return Boolean(value)
    case 'date':
      return new Date(value)
    default:
      return value
  }
}
