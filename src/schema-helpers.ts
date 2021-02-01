import * as knex from "knex"
import { ValueOf } from "type-fest"

import { IgnorableProps, KnexNoArgs, KnexMethod, TriggerEvent } from "./constants"
import { findKey, executeQuery, isWhereList, isWhereEqual, isWhereOperator } from "./helpers"
import {
  invariant,
  isFunction,
  isObject,
  isString,
  mapObj,
  toArray
} from "./util"

import * as ColumnType from "./types/column-types"
import { Query } from "./types/queries"

import {
  ColumnDescriptor,
  ModelProps,
  ModelRecord,
  ResolveModelSchema,
  ModelType,
  Schema,
  SerializedType,
  CastToDefinition
} from "./types/schemas"

import { Const, Fn, Listable, Nullable } from "./types/utils"
import * as validators from "./types/validators"

import { Model } from "./model"
import { Criteria, Where, WhereList } from "./types/criteria"

type ColumnTypeString = NonNullable<ColumnType.ColumnType>

const TimestampTriggerTemplate = `
create trigger if not exists :name: after update on :modelName: begin
  update :modelName: set :column: = \`current_timestamp\`
  where :key: = \`old\`.:key:;
end
`

const KnexMethodMap: Record<ColumnTypeString, KnexMethod> = {
  string: KnexMethod.text,
  array: KnexMethod.text,
  object: KnexMethod.text,
  json: KnexMethod.text,
  number: KnexMethod.integer,
  boolean: KnexMethod.integer,
  date: KnexMethod.dateTime,
  increments: KnexMethod.increments
}

const SerializerMap: Record<ColumnTypeString, Fn<any, SerializedType>> = {
  string: value => String(value),
  array: value => JSON.stringify(value),
  object: value => JSON.stringify(value),
  json: value => JSON.stringify(value),
  number: value => Number(value),
  boolean: value => Number(value),
  increments: value => Number(value),
  date: value => (value as Date).toISOString()
}

const DeserializerMap: Record<ColumnTypeString, Fn<any, ModelType>> = {
  string: value => String(value),
  array: value => JSON.parse(value),
  object: value => JSON.parse(value),
  json: value => JSON.parse(value),
  number: value => Number(value),
  increments: value => Number(value),
  boolean: value => Boolean(value),
  date: value => new Date(value)
}

const isKnownColumnType = (type: string): type is ColumnTypeString =>
  type in ColumnType

export const toKnexMethod = (type: ColumnTypeString): KnexMethod | never =>
  KnexMethodMap[type]

const createIndices = (
  table: knex.TableBuilder,
  value: validators.Index
): void => {
  if (isString(value)) {
    table.index([value])
  } else if (Array.isArray(value)) {
    if (value.every(isString)) {
      table.index(value)
    }

    value.forEach(columns => table.index(columns))
  } else if (isObject(value)) {
    for (const [indexName, columns] of Object.entries(value)) {
      table.index(toArray(columns), indexName)
    }
  }
}

export const createTimestampTrigger = async (
  model: Model<any>,
  column = "updated_at"
): Promise<unknown> => {
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

  return executeQuery(model.ctx, query, { model, internal: true })
}

const getDataType = <
  T extends ColumnDescriptor<any>
> (property: T): ColumnTypeString | never => {
  let type: Nullable<string | T> = property

  if (isFunction(property)) {
    type = property.name
  } else if (isObject(property)) {
    type = isFunction(property.type)
      ? property.type.name
      : property.type
  }

  if (isString(type)) {
    const lower = type.toLowerCase()

    if (!isKnownColumnType(lower)) {
      // TODO: throw an error here?
      return "string"
    }

    return lower
  }

  invariant(false, "column type must be of type string")
}

export const toKnexSchema = <T extends Schema> (
  model: Model<T>,
  options: validators.ModelOptions
) => {
  return (table: knex.TableBuilder): void => {
    // every property of `model.schema` is a column
    for (const [name, descriptor] of Object.entries(model.schema)) {
      // these timestamp fields are handled as part of the model options
      // processing below, ignore them here so we don't duplicate the fields
      if (options.timestamps && (name === "created_at" || name === "updated_at")) {
        continue
      }

      // each column's value is either its type or a descriptor
      const type = getDataType(descriptor)
      const partial = table[toKnexMethod(type)](name)

      if (isFunction(descriptor) || !isObject(descriptor)) {
        continue
      }

      const props = validators.ColumnDescriptor.check(descriptor)

      if ("nullable" in props) {
        if ("notNullable" in props) {
          invariant(false, "can't set both 'nullable' & 'notNullable' - they work inversely")
        }

        props.notNullable = !props.nullable
      }

      for (const [property, value] of Object.entries(props)) {
        if (property in IgnorableProps) continue

        if (property in KnexNoArgs) {
          value != null && partial[property as keyof typeof KnexNoArgs]()
        } else {
          (partial as any)[property](value)
        }
      }
    }

    for (const [key, value] of Object.entries(options)) {
      if (key === "timestamps" && options.timestamps) {
        table.timestamps(false, true)

        void createTimestampTrigger(model)
      } else if (key === "index" && value != null) {
        createIndices(table, value as Exclude<(typeof options)["index"], undefined>)
      } else {
        ;(table as any)[key](value)
      }
    }
  }
}

export const createTrigger = async (
  model: Model<any, any>,
  event: TriggerEvent
): Promise<[Query, () => Promise<any[]>]> => {
  const keys = Object.keys(model.schema)
  const tableName = `${model.name}_returning_temp`
  const triggerName = `on_${event}_${model.name}`
  const keyBindings = keys.map(() => "??").join(", ")
  const fieldPrefix = event === TriggerEvent.Delete ? "old." : "new."
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
  ].map(async query => executeQuery(model.ctx, query, queryOptions)))

  let query = model.ctx.knex(tableName)
  if (event === TriggerEvent.Insert) {
    query = query.first()
  }

  const cleanup = async (): Promise<any[]> => {
    return Promise.all([
      model.ctx.knex.raw("drop table if exists ??", tableName),
      model.ctx.knex.raw("drop trigger if exists ??", triggerName)
    ].map(async query => executeQuery(model.ctx, query, queryOptions)))
  }

  return [query, cleanup]
}

export const normalizeSchema = <
  ModelSchema extends Schema,
  Resolved extends ResolveModelSchema<ModelSchema> = ResolveModelSchema<ModelSchema>
> (schema: Const<ModelSchema>, options: validators.ModelOptions): Resolved => {
  const keys: Array<keyof ModelSchema> = Object.keys(schema)
  invariant(keys.length > 0, "model schemas cannot be empty")

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const result = {} as Resolved
  for (const key of keys) {
    const descriptor = schema[key]
    const type = typeof descriptor

    ;(result as any)[key] = type === "function" || type === "string"
      ? { type: descriptor }
      : descriptor
  }

  if (options.timestamps) {
    ;(result as any).created_at = { type: ColumnType.Date }
    ;(result as any).updated_at = { type: ColumnType.Date }
  }

  return result
}

export const serializeValue = (type: ColumnTypeString, value: any): SerializedType =>
  SerializerMap[type](value)

export const deserializeValue = (type: ColumnTypeString, value: any): ModelType | never =>
  DeserializerMap[type](value)

export const castValue = (value: unknown): number | string | never => {
  const type = typeof value
  if (type === "number" || type === "string") {
    return value as number | string
  }

  if (type === "boolean") return Number(value)

  if (Array.isArray(value) || isObject(value)) {
    return JSON.stringify(value)
  }

  invariant(false, `Could not cast value of type ${type}`)
}

export class Cast <
  Context extends Model<any, any> = Model<Schema, ModelProps<Schema>>,
  // ObjectInput extends ModelRecord = Context["_props"]["objectInput"],
  ObjectOutput extends ModelRecord = Context["_props"]["objectOutput"]
> {
  constructor (private readonly model: Context) {
    this.model = model
  }

  /**
   * Serialize a record (or set of criteria), preparing it for insertion or
   * comparison.
   *
   * @param object Criteria or record to cast
   * @param options Options for configuring the cast
   */
  serialize (
    object: Nullable<Where<ObjectOutput>>,
    options: { raw?: boolean }
  ): CastToDefinition
  serialize (
    object: Nullable<WhereList<ObjectOutput>>,
    options: { raw?: boolean }
  ): CastToDefinition[]
  serialize (
    object: Nullable<Criteria<ObjectOutput>>,
    options: { raw?: boolean }
  ): Listable<CastToDefinition> {
    if (object == null) {
      return null
    }

    if (isWhereEqual(object)) {
      const serialized = this.serializeColumn(object[0], object[1], options)
      return {
        [object[0]]: serialized
      }
    }

    if (isWhereOperator(object)) {
      const serialized = this.serializeColumn(object[0], object[2], options)
      return [String(object[0]), object[1], serialized]
    }

    if (isWhereList(object)) {
      return object.map(clause => this.serialize(clause, options))
    }

    if (isObject(object)) {
      return mapObj(object, (value, column) =>
        this.serializeColumn(column, value, options)
      )
    }

    invariant(false, `invalid input type: '${typeof object}'`)
  }

  /**
   * Cast a record from the model's representation back to its runtime
   * equivalent.
   *
   * @param object Record to cast
   * @param options Options for configuring the cast
   */
  deserialize (
    object: Partial<ObjectOutput>,
    options: { raw?: boolean }
  ): ObjectOutput {
    if (
      object == null ||
      (Array.isArray(object) && object.length < 1) ||
      (isObject(object) && Object.keys(object).length < 1)
    ) {
      invariant(false, `cannot cast null or invalid object`)
    }

    return mapObj(object, (value, column) => {
      return this.deserializeColumn(column, value, options)
    })
  }

  /**
   * Serialize `value` for storage.
   *
   * @param column Name of the property to cast toward
   * @param value Input value to be cast
   * @param options Options for configuring the cast
   */
  serializeColumn <K extends keyof ObjectOutput> (
    column: K,
    value: any,
    options: { raw?: boolean } = { raw: false }
  ): SerializedType {
    const definition = this.model.schema[column]
    invariant(
      !(definition.notNullable && value == null),
      `${this.model.name}.${String(column)} is not nullable but received nil`
    )

    const type = getDataType(definition)
    const cast = value !== null ? serializeValue(type, value) : value

    if (!options.raw && isFunction(definition.set)) {
      return castValue(definition.set(cast))
    }

    return cast
  }

  /**
   * Cast `value` back to its runtime type, defined in the model by the
   * property `column`.
   *
   * @param column Name of the property to cast from
   * @param value Return value to be cast
   * @param options Options for configuring the cast
   */
  deserializeColumn <
    K extends keyof ObjectOutput,
    V extends ValueOf<ObjectOutput, K> = ValueOf<ObjectOutput, K>
  > (
    column: K,
    value: any,
    options: { raw?: boolean } = { raw: false }
  ): V | null {
    const definition = this.model.schema[column]
    const type = getDataType(definition)

    const cast = value === null ? null : deserializeValue(type, value)

    if (!options.raw && isFunction(definition.get)) {
      return definition.get(cast)
    }

    return cast as V
  }
}
