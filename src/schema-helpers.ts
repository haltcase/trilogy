import { ColumnTypes, IgnorableProps, KnexNoArgs } from './constants'
import { isWhereMultiple, isWhereTuple, findKey, runQuery } from './helpers'
import {
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

const TimestampTriggerTemplate = `
create trigger if not exists :name: after update on :modelName: begin
  update :modelName: set :column: = current_timestamp
  where :key: = \`old\`.:key:;
end
`

export function toKnexSchema <D extends types.ReturnDict> (
  model: Model<D>,
  options: types.ModelOptions
) {
  return (table: knex.TableBuilder) => {
    // every property of `model.schema` is a column
    for (const [name, descriptor] of Object.entries(model.schema)) {
      // these timestamp fields are handled as part of the model options
      // processing below, ignore them here so we don't duplicate the fields
      if (options.timestamps && (name === 'created_at' || name === 'updated_at')) {
        continue
      }

      // each column's value is either its type or a descriptor
      const type = getDataType(descriptor)
      const partial = table[toKnexMethod(type)](name)

      if (isFunction(descriptor) || !isObject(descriptor)) {
        continue
      }

      const props = types.ColumnDescriptor.check(descriptor)

      if ('nullable' in props) {
        if ('notNullable' in props) {
          invariant(false, `can't set both 'nullable' & 'notNullable' - they work inversely`)
        }

        props.notNullable = !props.nullable
      }

      for (const [property, value] of Object.entries(props)) {
        if (property in IgnorableProps) continue

        if (property in KnexNoArgs) {
          value && partial[property as keyof typeof KnexNoArgs]()
        } else {
          (partial as any)[property](value)
        }
      }
    }

    for (const [key, value] of Object.entries(options)) {
      if (key === 'timestamps' && options.timestamps) {
        table.timestamps(false, true)

        // tslint:disable-next-line:no-floating-promises
        createTimestampTrigger(model)
      } else if (key === 'index' && value) {
        createIndices(table, value as Exclude<(typeof options)['index'], undefined>)
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
    for (const [indexName, columns] of Object.entries(value)) {
      table.index(toArray(columns), indexName)
    }
  }
}

export enum TriggerEvent {
  Insert = 'insert',
  Update = 'update',
  Delete = 'delete'
}

export async function createTrigger (
  model: Model<any>,
  event: TriggerEvent
): Promise<[types.Query, () => Promise<any[]>]> {
  const keys = Object.keys(model.schema)
  const tableName = `${model.name}_returning_temp`
  const triggerName = `on_${event}_${model.name}`
  const keyBindings = keys.map(() => '??').join(', ')
  const fieldPrefix = event === TriggerEvent.Delete ? 'old.' : 'new.'
  const fieldReferences = keys.map(k => fieldPrefix + k)
  const queryOptions = { model, internal: true }

  const tempTable = `create table if not exists ?? (${keyBindings})`
  const tempTrigger = `
    create trigger if not exists ?? after ${event} on ?? begin
      insert into ?? select ${keyBindings};
    end
  `

  await Promise.all([
    model.ctx.knex.raw(tempTable, [tableName, ...keys]),
    model.ctx.knex.raw(
      tempTrigger,
      [triggerName, model.name, tableName, ...fieldReferences]
    )
  ].map(query => runQuery(model.ctx, query, queryOptions)))

  let query = model.ctx.knex(tableName)
  if (event === TriggerEvent.Insert) {
    // tslint:disable-next-line:semicolon
    ;(query as any) = query.first()
  }

  const cleanup = () => {
    return Promise.all([
      model.ctx.knex.raw(`drop table if exists ??`, tableName),
      model.ctx.knex.raw(`drop trigger if exists ??`, triggerName)
    ].map(query => runQuery(model.ctx, query, queryOptions)))
  }

  return [query, cleanup]
}

export async function createTimestampTrigger (model: Model<any>, column = 'updated_at') {
  const { key, hasIncrements } = findKey(model.schema)

  if (!key && !hasIncrements) {
    // there's no way to uniquely identify the updated record
    return
  }

  const query = model.ctx.knex.raw(TimestampTriggerTemplate, {
    name: `on_update_${model.name}_timestamp`,
    modelName: model.name,
    column,
    key
  })

  return runQuery(model.ctx, query, { model, internal: true })
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
> (schema: T, options: types.ModelOptions): O {
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

  if (options.timestamps) {
    // tslint:disable-next-line:semicolon
    ;(result as any).created_at = { type: Date }
    ;(result as any).updated_at = { type: Date }
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

    if (!(lower in ColumnTypes)) {
      return 'string'
    }

    return lower
  }

  invariant(false, `column type must be of type string`)
}

export function toKnexMethod (
  type: string
): 'text' | 'integer' | 'dateTime' | 'increments' | never {
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
      invariant(false, `invalid column type definition: ${type}`)
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
      return (value as Date).toISOString()
    default:
      invariant(false, `invalid type on insert to database: ${type}`)
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
      invariant(false, `invalid type returned from database: ${type}`)
  }
}

export class Cast <D extends types.ReturnDict> {
  constructor (private model: Model<D>) {}

  toDefinition (
    object: types.LooseObject | types.Criteria2 | types.CriteriaList,
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
      return object.map(clause => this.toDefinition(clause, options))
    }

    if (isObject(object)) {
      return mapObj(object, (value, column) => {
        return this.toColumnDefinition(column, value, options) as any
      })
    }

    invariant(false, `invalid input type: '${typeof object}'`)
  }

  fromDefinition (object: types.LooseObject, options: { raw?: boolean }): D {
    return mapObj(object, (value, column) => {
      return this.fromColumnDefinition(column, value, options) as any
    })
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
