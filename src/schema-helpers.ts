import { KNEX_NO_ARGS, COLUMN_TYPES, IGNORABLE_PROPS } from './constants'
import { isWhereMultiple, isWhereTuple } from './helpers'
import * as util from './util'

import * as knex from 'knex'
import Model from './model'
import * as types from './types'

export function toKnexSchema (model: Model, options: types.ModelOptions) {
  return (table: knex.TableBuilder) => {
    // every property of `model.schema` is a column
    util.eachObj(model.schema, (descriptor, name) => {
      // each column's value is either its type or a descriptor
      const type = getDataType(descriptor)
      const partial = table[toKnexMethod(type)](name)

      if (util.isFunction(descriptor) || !util.isObject(descriptor)) return

      const columnProperties =
        types.validate(descriptor, types.ColumnDescriptor, {})

      util.eachObj(columnProperties, (value, property) => {
        if (IGNORABLE_PROPS.includes(property)) return

        if (KNEX_NO_ARGS.includes(property)) {
          columnProperties[property] && partial[property]()
        } else {
          partial[property](value)
        }
      })
    })

    for (const key of Object.keys(options)) {
      const value = options[key]
      if (key === 'timestamps') {
        options.timestamps && table.timestamps(true, true)
      } else if (key === 'index') {
        createIndices(table, value)
      } else {
        table[key](value)
      }
    }
  }
}

function createIndices (table: knex.TableBuilder, value: types.Index) {
  if (typeof value === 'string') {
    table.index([value])
  } else if (Array.isArray(value)) {
    if (value.every(item => typeof item === 'string')) {
      table.index(value as string[])
    }

    value.forEach(columns => table.index(columns as string[]))
  } else if (util.isObject(value)) {
    util.eachObj(value, (columns, indexName) => {
      if (!Array.isArray(columns)) {
        columns = [columns]
      }

      table.index(columns, indexName)
    })
  }
}

// for inserts / updates
export function toDefinition (model: Model, object, options: { raw?: boolean }) {
  if (util.isObject(object)) {
    return util.mapObj(object, (value, column) => {
      return toColumnDefinition(model, column, value, options)
    })
  }

  if (isWhereTuple(object)) {
    const clone = object.slice()
    const valueIndex = clone.length - 1
    clone[valueIndex] =
      toColumnDefinition(model, clone[0], clone[valueIndex], options)
    return clone
  }

  if (isWhereMultiple(object)) {
    return object.map(clause => toDefinition(model, clause, options))
  }

  // TODO: consider throwing for unrecognized types
}

// for selects
export function fromDefinition (model: Model, object, options: { raw?: boolean }) {
  return util.mapObj(object, (value, column) => {
    return fromColumnDefinition(model, column, value, options)
  })
}

// for inserts / updates
export function toColumnDefinition (
  model: Model,
  column: string,
  value,
  options: { raw?: boolean } = { raw: false }
) {
  const definition = model.schema[column]
  util.invariant(
    !(definition.notNullable && value == null),
    `${this.model.name}.${column} is not nullable but received nil`
  )

  const type = getDataType(definition)
  const cast = value !== null ? toInputType(type, value) : value

  if (!options.raw && util.isFunction(definition.set)) {
    return castValue(definition.set(cast))
  }

  return cast
}

// for selects
export function fromColumnDefinition (
  model: Model,
  column: string,
  value,
  options: { raw?: boolean } = { raw: false }
) {
  const definition = model.schema[column]
  const type = getDataType(definition)
  const cast = value !== null ? toReturnType(type, value) : value

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

export function normalizeSchema (schema: types.SchemaRaw): types.Schema {
  const result = {}

  for (const key of Object.keys(schema)) {
    const descriptor = schema[key]
    const type = util.isType(descriptor)

    result[key] = type === 'function' || type === 'string'
      ? { type: descriptor }
      : descriptor
  }

  return result
}

function getDataType (property: types.ColumnDescriptor): string {
  let type: string | types.ColumnDescriptor = property

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

  if (!COLUMN_TYPES.includes(type as string)) {
    type = 'string'
  }

  return type as string
}

export function toKnexMethod (type: string): string {
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

export function toInputType (type: string, value) {
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

export function toReturnType (type: string, value) {
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

export class Cast {
  constructor (private model: Model) {}

  toDefinition (object, options: { raw?: boolean }) {
    if (util.isObject(object)) {
      return util.mapObj(object, (value, column) => {
        return this.toColumnDefinition(column, value, options)
      })
    }

    if (isWhereTuple(object)) {
      const clone = object.slice()
      const valueIndex = clone.length - 1
      clone[valueIndex] =
        this.toColumnDefinition(clone[0], clone[valueIndex], options)
      return clone
    }

    if (isWhereMultiple(object)) {
      return object.map(clause => this.toDefinition(clause, options))
    }

    // TODO: consider throwing for unrecognized types
  }

  fromDefinition (object, options: { raw?: boolean }) {
    return util.mapObj(object, (value, column) => {
      return this.fromColumnDefinition(column, value, options)
    })
  }

  toColumnDefinition (
    column: string,
    value: any,
    options: { raw?: boolean } = { raw: false }
  ) {
    const definition = this.model.schema[column]
    util.invariant(
      !(definition.notNullable && value == null),
      `${this.model.name}.${column} is not nullable but received nil`
    )

    const type = getDataType(definition)
    const cast = value !== null ? toInputType(type, value) : value

    if (!options.raw && util.isFunction(definition.set)) {
      return castValue(definition.set(cast))
    }

    return cast
  }

  fromColumnDefinition (
    column: string,
    value: any,
    options: { raw?: boolean } = { raw: false }
  ) {
    const definition = this.model.schema[column]
    const type = getDataType(definition)
    const cast = value !== null ? toReturnType(type, value) : value

    if (!options.raw && util.isFunction(definition.get)) {
      return definition.get(cast)
    }

    return cast
  }
}
