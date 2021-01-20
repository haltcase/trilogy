import {
  Raw,
  SchemaBuilder,
  QueryBuilder
} from "knex"

import t from "runtypes"

import Model from "./model"
import { Driver } from "./constants"
import * as ColumnType from "./column-types"
import { isFunction } from "./util"

export type Fn <T extends any[], R = any> = (...args: T) => R

export type Listable <T> = T | T[]

export type Nullable <T> = T | null | undefined

type OptionalKeys <T> = Exclude<{
  [K in keyof T]: T extends Record<K, T[K]> ? never : K
}[keyof T], undefined>

export type KeysOfType <T, U> = Exclude<{
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T], undefined>

export type Compulsory <T extends object> = {
  [K in keyof T]-?: NonNullable<T[K]>
}

export type LooseObject = Record<string, any>
export type StringKeys <T = LooseObject> = Extract<keyof T, string>
export type ValueOf <T, StringKeysOnly = false> =
  T[StringKeysOnly extends true ? StringKeys<T> : keyof T]

export type DistinctArrayTuple <T, V = any> = T extends [string, string, V]
  ? [string, string, V]
  : T extends [string, V]
    ? [string, V]
    : T extends V[]
      ? V[]
      : V

export type Query =
  | Raw<any>
  | QueryBuilder<any, any>
  | SchemaBuilder

export type QueryLike = Query | Promise<boolean>

export type Criteria2 <D = LooseObject> = [StringKeys<D>, D[StringKeys<D>]]
export type Criteria3 <D = LooseObject> = [StringKeys<D>, string, D[StringKeys<D>]]
export type CriteriaObj <D = LooseObject> = Partial<D>

export type CriteriaBase <D = LooseObject> =
  | Criteria2<DistinctArrayTuple<D>>
  | Criteria3<DistinctArrayTuple<D>>
  | CriteriaObj<D>

export type CriteriaBaseNormalized <D = LooseObject> =
  | Criteria3<DistinctArrayTuple<D>>
  | CriteriaObj<D>

export type CriteriaList <D = LooseObject> =
  Array<CriteriaBase<DistinctArrayTuple<D>>>

export type CriteriaListNormalized <D = LooseObject> =
  Array<CriteriaBaseNormalized<DistinctArrayTuple<D>>>

export type Criteria <D = LooseObject> =
  | CriteriaBase<D>
  | CriteriaList<D>

export type CriteriaNormalized <D = LooseObject> =
  | CriteriaBaseNormalized<D>
  | CriteriaListNormalized<D>

export const Index = t.Union(
  t.String,
  t.Array(t.Union(t.String, t.Array(t.String))),
  t.Dictionary(t.Union(t.String, t.Array(t.String)))
)

export const GroupClause = t.Union(
  t.String,
  t.Array(t.String)
)

export const OrderClause = t.Union(
  t.String,
  t.Tuple(t.String, t.String)
)

export const TrilogyOptions = t.Partial({
  client: t.Union(t.Literal("sqlite3"), t.Literal("sql.js")),
  dir: t.String
})

export const ModelOptions = t.Partial({
  index: Index,
  primary: t.Array(t.String),
  unique: t.Array(t.String),
  timestamps: t.Boolean
})

export const AggregateOptions = t.Partial({
  distinct: t.Boolean,
  group: GroupClause,
  order: OrderClause
})

export const CreateOptions = t.Partial({
  raw: t.Boolean
})

export const FindOptions = t.Partial({
  limit: t.Number,
  order: OrderClause,
  random: t.Boolean,
  raw: t.Boolean,
  skip: t.Number
})

export const UpdateOptions = t.Partial({
  raw: t.Boolean
})

export interface QueryOptions <
  Props extends ModelProps<Schema> = ModelProps<Schema>
> {
  model?: Model<Props["schema"]>
  needResponse?: boolean
  internal?: boolean
}

export const ColumnKind = t.Union(t.String, t.Function)
  .withConstraint<NonNullable<ColumnKind>>(value => {
    const type = isFunction(value)
      ? value.name
      : value

    return [
      ColumnType.Array,
      ColumnType.Boolean,
      ColumnType.Date,
      ColumnType.Increments,
      ColumnType.Json,
      ColumnType.Number,
      ColumnType.Object,
      ColumnType.String
    ].includes(type.toLowerCase() as Extract<ColumnKind, string>)
  }, { name: "ColumnKind" })

export const ColumnDescriptor = t.Partial({
  type: ColumnKind,
  defaultTo: t.Unknown,
  index: t.String,
  notNullable: t.Boolean,
  nullable: t.Boolean,
  primary: t.Boolean,
  unique: t.Boolean,
  get: t.Function,
  set: t.Function
})

export type Index = t.Static<typeof Index>
export type Order = t.Static<typeof OrderClause>
export type Group = t.Static<typeof GroupClause>

export type TrilogyOptions = t.Static<typeof TrilogyOptions>
export type ModelOptions = t.Static<typeof ModelOptions>
export type AggregateOptions = t.Static<typeof AggregateOptions>
export type CreateOptions = t.Static<typeof CreateOptions>
export type UpdateOptions = t.Static<typeof UpdateOptions>
export type FindOptions = t.Static<typeof FindOptions>

export type TrilogyOptionsNormalized = Compulsory<TrilogyOptions & {
  connection: { filename: string }
}>

export type ColumnKind =
  | null
  | undefined
  | ColumnType.Array
  | ColumnType.Boolean
  | ColumnType.Date
  | ColumnType.Increments
  | ColumnType.Json
  | ColumnType.Number
  | ColumnType.Object
  | ColumnType.String
  | ArrayConstructor
  | BooleanConstructor
  | DateConstructor
  | NumberConstructor
  | ObjectConstructor
  | StringConstructor

export type ColumnDescriptor <
  T = unknown
> = {
  /**
   * The value type stored in this column.
   */
  type: RuntimeSchemaType<T>,

  /**
   * Default value to use when input is absent.
   */
  defaultTo?: StaticSchemaType<T>,

  /**
   * Specifies the property to be indexed with the provided name.
   */
  index?: string,

  /**
   * Whether to force `null` inputs to raise errors.
   * Works inversely to `nullable`.
   */
  notNullable?: boolean,

  /**
   * Whether to allow `null` as a value.
   * Works inversely to `nonNullable`.
   */
  nullable?: boolean,

  /**
   * Whether to set this property as the primary key for the model.
   */
  primary?: boolean,

  /**
   * Whether the property is required to be unique.
   */
  unique?: boolean,

  /**
   * Function executed on selects, receives the raw value and
   * should return a new value to be returned instead.
   */
  get?: (value: StaticSchemaType<T>) => StaticSchemaType<T>,

  /**
   * Function executed on inserts, receives the input value and
   * should return a new value to be inserted instead.
   */
  set?: (value: StaticSchemaType<T>) => StaticSchemaType<T>
}

export type KindOrDescriptor <T extends ColumnKind> =
  T | ColumnDescriptor<T>

export type ExtractDescriptorType <T> =
  T extends ColumnDescriptor<any> ? T["type"] :
  T extends ColumnKind ? T :
  never

/**
 * Schemas are objects where the values describe the data type
 * allowed by their keys.
 */
export type SchemaBase = Record<string, KindOrDescriptor<ColumnKind>>
// export type SchemaBase <T extends ColumnKind | LooseObject> =
//   T extends ColumnKind ? 1 :
//   T extends LooseObject ? SchemaFromShape<T> :
//   never

/**
 * Create a schema type from a given object shape.
 */
export type SchemaFromShape <T extends LooseObject> = {
  [Key in StringKeys<T>]: KindOrDescriptor<RuntimeSchemaType<T[Key], T>>
}

export type Schema <T extends LooseObject = any> =
  SchemaBase | SchemaFromShape<T>

export type SchemaNormalized <T extends Schema<any>> = {
  [Key in keyof T]: ColumnDescriptor<ExtractDescriptorType<T[Key]>>
}

export type ModelProps <T extends Schema<any>> = {
  schema: T,
  objectInput: InferObjectShape<T>,
  objectOutput: Required<InferObjectShape<T>>
}

export type OptionalColumnKinds =
  | ColumnType.Increments

export type OptionalColumnAttributes =
  | { type: OptionalColumnKinds }
  | { defaultTo: unknown }
  | { nullable: true }
  | { nonNullable: false }

type OptionalSchemaKeysImpl <T> =
  | OptionalKeys<T>
  | KeysOfType<T, OptionalColumnKinds | OptionalColumnAttributes>

export type OptionalSchemaKeys <T extends Schema> = Extract<
  T extends SchemaFromShape<infer Shape>
    ? OptionalSchemaKeysImpl<Shape>
    : OptionalSchemaKeysImpl<T>
, string>

export type RequiredSchemaKeys <T extends Schema> =
  StringKeys<Omit<T, OptionalSchemaKeys<T>>>

export type SqlJsResponse = Array<{
  columns: string[]
  values: any[]
}>

export type StorageType = string | number | Date | null | undefined

export type ReturnType = NonNullable<StaticSchemaType<ColumnKind>>
// export type ReturnType =
//   | string
//   | number
//   | boolean
//   | null
//   | undefined
//   | any[]
//   | Date
//   | LooseObject

export type ReturnDict = Record<string, ReturnType>

export type CastToDefinition =
  | Record<string, StorageType>
  | [string, StorageType]
  | [string, string, StorageType]
  | CriteriaList
  | never

export type QueryResult <
  DriverType extends Driver = Driver.native,
  Q extends QueryLike = Query
> =
  DriverType extends Driver.native
    ? Query
    : Q extends Promise<boolean>
      ? boolean
      : unknown[]

/**
 * Convert a static type to its runtime equivalent.
 *
 * @example RuntimeSchemaType<number> -> NumberConstructor | "number"
 */
export type RuntimeSchemaType <PropertyType, D = LooseObject> =
  // maintain nullability of the given type
  (null extends PropertyType ? null : never) | (
  PropertyType extends undefined ? undefined :
  PropertyType extends ColumnType.Increments ? ColumnType.Increments :
  PropertyType extends ColumnType.Json ? ColumnType.Json :
  PropertyType extends unknown[] | ColumnType.Array | ArrayConstructor ? ArrayConstructor | ColumnType.Array :
  PropertyType extends boolean | ColumnType.Boolean | BooleanConstructor ? BooleanConstructor | ColumnType.Boolean :
  PropertyType extends Date | ColumnType.Date | DateConstructor ? DateConstructor | ColumnType.Date :
  PropertyType extends number | ColumnType.Number | NumberConstructor ? NumberConstructor | ColumnType.Number :
  PropertyType extends ColumnType.Object | ObjectConstructor ? ObjectConstructor | ColumnType.Object :
  PropertyType extends ColumnType.String | string | StringConstructor ? StringConstructor | ColumnType.String :
  // check this case last because *Constructor types match `LooseObject :
  PropertyType extends D ? ObjectConstructor | ColumnType.Object :
  // anything else is an error
  never
)

/**
 * Convert a runtime type to its static equivalent.
 *
 * @example StaticSchemaType<NumberConstructor> -> number
 */
export type StaticSchemaType <PropertyType> =
  // maintain nullability of the given type
  (null extends PropertyType ? null : never) | (
  PropertyType extends undefined ? undefined :
  PropertyType extends ColumnType.Increments ? number :
  PropertyType extends ColumnType.Json ? LooseObject | unknown[] :
  PropertyType extends ColumnType.Array | ArrayConstructor | unknown[] ? unknown[] :
  PropertyType extends ColumnType.Boolean | BooleanConstructor | boolean ? boolean :
  PropertyType extends ColumnType.Date | DateConstructor | Date ? Date :
  PropertyType extends ColumnType.Number | NumberConstructor | number ? number :
  PropertyType extends ColumnType.Object | ObjectConstructor ? LooseObject :
  PropertyType extends ColumnType.String | StringConstructor | string ? string :
  // check this case last because *Constructor types match `LooseObject :
  PropertyType extends LooseObject ? LooseObject :
  // anything else is an error
  never
)

/**
 * Convert a runtime schema type to the static shape of objects
 * allowed by that schema.
 */
export type StaticObjectShape <T> = {
  [K in StringKeys<T>]: StaticSchemaType<ExtractDescriptorType<T[K]>>
}

export type ExtractObjectShape <T extends Schema<any>> =
  T extends SchemaFromShape<infer Shape>
    ? StaticObjectShape<Shape>
    : T extends SchemaBase
      ? StaticObjectShape<T>
      : never

export type InferObjectShape <
  ModelSchema extends Schema<any>,
  ModelObject = ExtractObjectShape<ModelSchema>,
  OptionalKeys extends StringKeys<ModelSchema> = OptionalSchemaKeys<ModelSchema>,
  RequiredKeys extends StringKeys<ModelSchema> = RequiredSchemaKeys<ModelSchema>
> = {
  [Key in OptionalKeys]+?: ModelSchema[Key] extends KindOrDescriptor<any> | undefined
    ? Key extends keyof ModelObject
      ? NonNullable<StaticSchemaType<ExtractDescriptorType<ModelSchema[Key]>>>
      : never
    : never
} & {
  [Key in RequiredKeys]-?: ModelSchema[Key] extends KindOrDescriptor<any> | undefined
    ? Key extends keyof ModelObject
      ? NonNullable<StaticSchemaType<ExtractDescriptorType<ModelSchema[Key]>>>
      : never
    : never
}
