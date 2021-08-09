import {
  ConditionalKeys,
  Merge,
  MergeExclusive,
  SetOptional,
  ValueOf
} from "type-fest"

import { ColumnType } from "./column-types"
import * as T from "./column-types"

import {
  type,
  IfUnknown,
  Nullable,
  OptionalKeys,
  Simplify,
  StringKeys,
  Widen
} from "./utils"

import { Operator } from "./criteria"

/**
 * The set of static types allowed in a column; the compile-time equivalent
 * to the runtime {@link ColumnType}.
 */
export type ModelType =
  StaticSchemaType<ColumnType> | null | undefined

/**
 * The base input type of any given record of a model.
 */
export type ModelRecord =
  Record<string, ModelType>

/**
 * The set of serialized data types that a `ModelType` will be cast to.
 */
export type SerializedType =
  | string
  | number
  | Date
  | null
  | undefined

/**
 * The base type of any serialized record.
 */
export type SerializedRecord =
  Record<string, SerializedType>

export type CastToDefinition <T extends SerializedRecord = SerializedRecord> =
  [keyof T, Operator, ValueOf<T>] | Partial<T> | null

/**
 * Convert a static type to its runtime equivalent.
 *
 * @example RuntimeSchemaType<number> -> ColumnType.Number
 */
export type RuntimeSchemaType <TStatic, D extends ModelRecord = ModelRecord> =
  /* eslint-disable @typescript-eslint/indent */
  // maintain nullability of the given type
  (null extends TStatic ? null : never) | (
  TStatic extends undefined ? undefined :
  TStatic extends T.Increments ? T.Increments :
  TStatic extends T.Json ? T.Json :
  TStatic extends unknown[] | T.Array ? T.Array :
  TStatic extends boolean | T.Boolean ? T.Boolean :
  TStatic extends Date | T.Date ? T.Date :
  TStatic extends number | T.Number ? T.Number :
  TStatic extends T.Object ? T.Object :
  TStatic extends T.String | string ? T.String :
  // check this case last because *Constructor types match `LooseObject` :
  TStatic extends D ? T.Object :
  // anything else is an error
  never
)
/* eslint-enable @typescript-eslint/indent */

/**
 * Convert a runtime type to its static equivalent.
 *
 * @example StaticSchemaType<"increments"> -> number
 */
export type StaticSchemaType <TRuntime extends ColumnType, ElementType = unknown> = {
  array: ElementType[]
  boolean: boolean
  date: Date
  number: number
  object: Record<string, ElementType>
  string: string
  increments: number
  json: Record<string, ElementType> | ElementType[]
}[NonNullable<TRuntime>]

interface ColumnDescriptorNullable {
  nullable?: boolean
}

interface ColumnDescriptorNotNullable {
  notNullable?: boolean
}

// this type is merged into `ColumnDescriptor` to overwrite its
// internal `nullable` and `notNullable` properties with ones
// that cannot be used together within a single `ColumnDescriptor`
type ColumnDescriptorNullability =
  MergeExclusive<ColumnDescriptorNullable, ColumnDescriptorNotNullable>

export type ColumnDescriptor <
  T extends ColumnType,
  StaticType = unknown,
  S = IfUnknown<StaticType, StaticSchemaType<T>, StaticType>
> = Simplify<Merge<{
  /**
   * The value type stored in this column.
   */
  type: T

  /**
   * Default value to use when input is absent.
   */
  defaultTo?: S

  /**
   * Specifies the property to be indexed with the provided name.
   */
  index?: string

  /**
   * Whether to force `null` inputs to raise errors.
   * Works inversely to `nullable`.
   */
  notNullable?: boolean

  /**
   * Whether to allow `null` as a value.
   * Works inversely to `nonNullable`.
   */
  nullable?: boolean

  /**
   * Whether to set this property as the primary key for the model.
   */
  primary?: boolean

  /**
   * Whether the property is required to be unique.
   */
  unique?: boolean

  /**
   * Function executed on selects, receives the raw value and
   * should return a new value to be returned instead.
   */
  get?: (value: Nullable<S>) => S

  /**
   * Function executed on inserts, receives the input value and
   * should return a new value to be inserted instead.
   */
  set?: (value: Nullable<S>) => S

  /**
   * @internal
   */
  _staticType?: StaticType
}, ColumnDescriptorNullability>>

type TryStatic <T> =
  T extends ColumnType ? StaticSchemaType<T> : T

export type KindOrDescriptor <T extends ColumnType, StaticType = StaticSchemaType<T>> =
  T | ColumnDescriptor<T, StaticType>

export type ExtractDescriptorType <T extends KindOrDescriptor<ColumnType>> =
  T extends ColumnDescriptor<infer U, infer V>
    ? Exclude<TryStatic<V>, U>
    : T extends ColumnType ? T : never

export type SchemaFromDefinition <
  Key extends string = string
> =
  Record<Key, KindOrDescriptor<ColumnType>>

/**
 * Create a {@link Schema} type from the given static object shape.
 */
export type SchemaFromShape <T extends ModelRecord> = {
  [Key in keyof T]: KindOrDescriptor<
    RuntimeSchemaType<T[Key], T>,
    TryStatic<T[Key]>
  >
}

type StaticFromSchemaDefinitionImpl <T extends Schema> = {
  [Key in keyof T]: StaticSchemaType<ExtractDescriptorType<T[Key]>>
}

/**
 * This type can be used to convert a schema definition intended for
 * trilogy models into a more generic static type, e.g. by converting
 * a field defined as `Increments` to `number`.
 */
export type StaticFromSchema <T extends Schema> =
  T extends SchemaFromDefinition<string> ? StaticFromSchemaDefinitionImpl<T> :
    T extends SchemaFromShape<infer Shape> ? {
      [Key in keyof Shape]: TryStatic<Shape[Key]>
    } :
      never

/**
 * Schemas are objects where the values describe the data type
 * allowed in the columns defined by their keys.
 */
export type Schema =
  | SchemaFromDefinition<string>
  | SchemaFromShape<any>

export type ExtractSchemaShape <ModelSchema extends SchemaFromDefinition<string>> = Widen<{
  [Key in keyof ModelSchema]: ModelSchema[Key] extends ColumnDescriptor<infer U, infer _>
    ? TryStatic<U>
    : TryStatic<ModelSchema[Key]>
}>[typeof type]

export type OptionalColumnKinds =
  | "increments"

export type NullableColumnAttributes =
  | { nullable: true }
  | { nonNullable: false }

export type OptionalColumnAttributes =
  | { type: OptionalColumnKinds }
  | { defaultTo: unknown }
  | NullableColumnAttributes

type OptionalSchemaKeysImpl <T, KeyCondition> =
  | OptionalKeys<T>
  | ConditionalKeys<T, KeyCondition>

export type OptionalSchemaKeys <
  ModelSchema extends SchemaFromDefinition,
  InputOrOutput = 0 | 1
> =
  Extract<OptionalSchemaKeysImpl<
    ModelSchema,
    OptionalColumnKinds | (
      InputOrOutput extends 0
        ? OptionalColumnAttributes
        : NullableColumnAttributes
    )
  >, string>

export type RequiredSchemaKeys <ModelSchema extends SchemaFromDefinition> =
  StringKeys<Omit<ModelSchema, OptionalSchemaKeys<ModelSchema>>>

type ResolveSchemaFromDefinitionImpl <ModelSchema extends SchemaFromDefinition> = {
  [Key in keyof ModelSchema]:
  ModelSchema[Key] extends Record<string, any>
    ? ColumnDescriptor<
        ModelSchema[Key]["type"],
        IfUnknown<
          ModelSchema[Key]["_staticType"],
          TryStatic<ModelSchema[Key]["type"]>,
          ModelSchema[Key]["_staticType"]
        >
      >
    : ColumnDescriptor<RuntimeSchemaType<ModelSchema[Key]>, TryStatic<ModelSchema[Key]>>
}

type ResolveSchemaFromShapeImpl <ModelSchema extends SchemaFromShape<any>> = {
  [Key in keyof ModelSchema]-?: ColumnDescriptor<
    RuntimeSchemaType<NonNullable<ModelSchema[Key]>>,
    Exclude<ExtractDescriptorType<ModelSchema[Key]>, ColumnType>
  >
}

export type ResolveModelSchema <ModelSchema extends Schema> =
  ModelSchema extends SchemaFromDefinition<string>
    ? ResolveSchemaFromDefinitionImpl<ModelSchema>
    : ModelSchema extends SchemaFromShape<any>
      ? ResolveSchemaFromShapeImpl<ModelSchema>
      : never

export type ResolveObjectShapeImpl <T extends ModelRecord> = {
  [Key in keyof T]: T[Key] extends ColumnType
    ? StaticSchemaType<T[Key]>
    : T[Key]
}

export type ResolveObjectInput <ModelSchema extends Schema> =
  ModelSchema extends SchemaFromDefinition<string>
    ? SetOptional<ExtractSchemaShape<ModelSchema>, OptionalSchemaKeys<ModelSchema>>
    : ModelSchema extends SchemaFromShape<infer T>
      ? SetOptional<ResolveObjectShapeImpl<T>, OptionalSchemaKeys<ModelSchema>>
      : never

export type ResolveObjectOutput <ModelSchema extends Schema> =
  ModelSchema extends SchemaFromDefinition<string>
    ? SetOptional<ExtractSchemaShape<ModelSchema>, OptionalSchemaKeys<ModelSchema, NullableColumnAttributes>>
    : ModelSchema extends SchemaFromShape<infer T>
      ? ResolveObjectShapeImpl<T>
      : never

export interface ModelProps <ModelSchema extends Schema> {
  schema: ResolveModelSchema<ModelSchema>
  objectInput: ResolveObjectInput<ModelSchema>
  objectOutput: ResolveObjectOutput<ModelSchema>
}
