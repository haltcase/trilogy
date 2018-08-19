import { KNEX_NO_ARGS, COLUMN_TYPES, IGNORABLE_PROPS } from './constants'
import { isWhereMultiple, isWhereTuple } from './helpers'
import {
  eachObj,
  invariant,
  isFunction,
  isObject,
  isString,
  mapObj,
  toArray
} from './util'

import * as knex from 'knex'
import Model from './model'
import * as types from './types'

export function toKnexSchema <D extends types.ReturnDict> (
  model: Model<D>,
  options: types.ModelOptions
) {
  return (table: knex.TableBuilder) => {
    // every property of `model.schema` is a column
    eachObj(model.schema, (descriptor, name) => {
      // each column's value is either its type or a descriptor
      const type = getDataType(descriptor)
      const partial: types.ValueOf<knex.TableBuilder> = (table as any)[toKnexMethod(type)](name)

      if (isFunction(descriptor) || !isObject(descriptor)) return

      const props =
        types.validate<types.ColumnDescriptor>(
          descriptor,
          types.ColumnDescriptor,
          {}
        )

      if ('nullable' in props) {
        if ('notNullable' in props) {
          invariant(false, `can't set both 'nullable' & 'notNullable' - they work inversely`)
        }

        props.notNullable = !props.nullable
      }

      eachObj(props, (value, property) => {
        if (IGNORABLE_PROPS.includes(property)) return

        if (KNEX_NO_ARGS.includes(property)) {
          props[property] && (partial as any)[property]()
        } else {
          props[property] && (partial as any)[property](value)
        }
      })
    })

    for (const key of Object.keys(options)) {
      const value = (options as any)[key]
      if (key === 'timestamps') {
        options.timestamps && table.timestamps(true, true)
      } else if (key === 'index') {
        createIndices(table, value)
      } else {
        (table as any)[key](value)
      }
    }
  }
}

function createIndices (table: knex.TableBuilder, value: types.Index) {
  if (isString(value)) {
    table.index([value])
  } else if (Array.isArray(value)) {
    if (value.every(isString)) {
      table.index(value as string[])
    }

    value.forEach(columns => table.index(columns as string[]))
  } else if (isObject(value)) {
    eachObj(value, (columns, indexName) => {
      table.index(toArray(columns), indexName)
    })
  }
}

export function castValue (value: any) {
  const type = typeof value
  if (type === 'number' || type === 'string') {
    return value
  }

  if (type === 'boolean') return Number(value)

  if (Array.isArray(value) || isObject(value)) {
    return JSON.stringify(value)
  }

  return value
}

export function normalizeSchema <
  D extends types.LooseObject,
  T extends types.SchemaRaw<D> = types.SchemaRaw<D>,
  O extends types.Schema<D> = types.Schema<D>
> (schema: T): O {
  const keys: (keyof T)[] = Object.keys(schema)
  invariant(keys.length > 0, 'model schemas cannot be empty')

  const result = {} as O
  for (const key of keys) {
    const descriptor = schema[key]
    const type = typeof descriptor

    ;(result as any)[key] = type === 'function' || type === 'string'
      ? { type: descriptor }
      : descriptor
  }

  return result
}

function getDataType (property: types.ColumnDescriptor): string | never {
  let type: string | types.ColumnDescriptor | undefined = property

  if (isFunction(property)) {
    type = property.name
  } else if (isObject(property)) {
    type = isFunction(property.type)
      ? property.type.name
      : property.type
  }

  if (isString(type)) {
    const lower = type.toLowerCase()

    if (!COLUMN_TYPES.includes(lower)) {
      return 'string'
    }

    return lower
  }

  return invariant(false, `column type must be of type string`)
}

export function toKnexMethod (type: string): string | never {
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
      return 'increments'
    default:
      return invariant(false, `invalid column type definition: ${type}`)
  }
}

export function toInputType (type: string, value: any): types.StorageType | never {
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
      return invariant(false, `invalid type on insert to database: ${type}`)
  }
}

export function toReturnType (type: string, value: any): types.ReturnType | never {
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
      return invariant(false, `invalid type returned from database: ${type}`)
  }
}

export class Cast <D extends types.ReturnDict> {
  constructor (private model: Model<D>) {}

  toDefinition (
    object: types.LooseObject | types.WhereTuple | types.WhereMultiple,
    options: { raw?: boolean }
  ): types.CastToDefinition {
    if (isWhereTuple(object)) {
      const clone = object.slice()
      const valueIndex = clone.length - 1
      clone[valueIndex] =
        this.toColumnDefinition(clone[0], clone[valueIndex], options)
      return clone
    }

    if (isWhereMultiple(object)) {
      return object.map(clause => this.toDefinition(clause, options)) as types.WhereMultiple
    }

    if (isObject(object)) {
      return mapObj(object, (value, column) => {
        return this.toColumnDefinition(column, value, options)
      })
    }

    return invariant(false, `invalid input type: '${typeof object}'`)
  }

  fromDefinition (object: types.LooseObject, options: { raw?: boolean }): D {
    return mapObj(object, (value, column) => {
      return this.fromColumnDefinition(column, value, options)
    }) as D
  }

  toColumnDefinition (
    column: string,
    value: any,
    options: { raw?: boolean } = { raw: false }
  ): types.StorageType {
    const definition = this.model.schema[column]
    invariant(
      !(definition.notNullable && value == null),
      `${this.model.name}.${column} is not nullable but received nil`
    )

    const type = getDataType(definition)
    const cast = value !== null ? toInputType(type, value) : value

    if (!options.raw && isFunction(definition.set)) {
      return castValue(definition.set(cast))
    }

    return cast
  }

  fromColumnDefinition (
    column: string,
    value: any,
    options: { raw?: boolean } = { raw: false }
  ): D[keyof D] {
    const definition = this.model.schema[column]
    const type = getDataType(definition)
    const cast = value !== null ? toReturnType(type, value) : value

    if (!options.raw && isFunction(definition.get)) {
      return definition.get(cast)
    }

    return cast
  }
}
