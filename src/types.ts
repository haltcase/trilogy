import {
  Raw,
  SchemaBuilder,
  QueryBuilder
} from "knex"

import t from "runtypes"

import Model from "./model"
import { ColumnTypes, Driver } from "./constants"
import { isFunction } from "./util"

export type Fn <T extends any[], R = any> = (...args: T) => R

export type Query =
  | Raw<any>
  | QueryBuilder<any, any>
  | SchemaBuilder

export type QueryLike = Query | Promise<boolean>

export type Listable <T> = T | T[]

export type Nullable <T> = T | null | undefined

export type Compulsory <T extends object> = {
  [K in keyof T]-?: NonNullable<T[K]>
}

export interface QueryOptions <
  Props extends ModelProps<LooseObject> = ModelProps<LooseObject>
> {
  model?: Model<Props["shape"], Props>
  needResponse?: boolean
  internal?: boolean
}

export type ModelProps <T> = {
  shape: T,
  schema: Schema<T>,
  objectOutput: InferObjectShape<Schema<T>>,
  objectInput: MarkOptionals<Schema<T>>
}

export type DistinctArrayTuple <T, V = any> = T extends [string, string, V]
  ? [string, string, V]
  : T extends [string, V]
    ? [string, V]
    : T extends V[]
      ? V[]
      : V

export type StringKeys <D = LooseObject> = Extract<keyof D, string>
export type LooseObject = Record<string, any>
export type ValueOf <D> = D[keyof D]

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

export const ColumnKind = t.Union(t.String, t.Function).withConstraint(value => {
  const type = isFunction(value) ? value.name : String(value)
  return type.toLowerCase() in ColumnTypes
}, { name: "ColumnKind" })

export const ColumnDescriptor = t.Partial({
  defaultTo: t.Unknown,
  index: t.String,
  notNullable: t.Boolean,
  nullable: t.Boolean,
  primary: t.Boolean,
  unique: t.Boolean,
  type: ColumnKind,
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
export type ColumnKind = t.Static<typeof ColumnKind>
export type ColumnDescriptor = t.Static<typeof ColumnDescriptor>

export type TrilogyOptionsNormalized = Compulsory<TrilogyOptions & {
  connection: { filename: string }
}>

export type Schema <T = LooseObject> = {
  [P in keyof Partial<T>]: ColumnKind | ColumnDescriptor
}

export type SchemaNormalized <T = LooseObject> = {
  [P in keyof Partial<T>]: ColumnDescriptor
}

export type SqlJsResponse = Array<{
  columns: string[]
  values: any[]
}>

export type StorageType = string | number | Date | null | undefined
export type ReturnType =
  | string
  | number
  | boolean
  | null
  | undefined
  | any[]
  | Date
  | LooseObject

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

export type ValueOfSchemaProperty <PropertyType, D = LooseObject, PropertyDefault = never> = (
  PropertyType extends typeof ColumnTypes["json"] ? D | D[] :
    PropertyType extends typeof ColumnTypes["string"] ? string :
      PropertyType extends typeof ColumnTypes["array"] ? any[] :
        PropertyType extends typeof ColumnTypes["object"] ? D :
          PropertyType extends typeof ColumnTypes["number"] ? number :
            PropertyType extends typeof ColumnTypes["boolean"] ? boolean :
              PropertyType extends typeof ColumnTypes["increments"] ? number :
                PropertyType extends typeof ColumnTypes["date"] ? Date :
                  PropertyType extends "json" ? D | D[] :
                    PropertyType extends "increments" ? number :
                      PropertyType extends StringConstructor ? string :
                        PropertyType extends NumberConstructor ? number :
                          PropertyType extends BooleanConstructor ? boolean :
                            PropertyType extends DateConstructor ? Date :
                              PropertyType extends ArrayConstructor ? D[] :
                                PropertyType extends ObjectConstructor ? D :
                                  PropertyType
) | (PropertyDefault extends never ? never : undefined)

export type KeysOfType <T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]

// TODO!: I don't think this type works; seems to be the only thing preventing model type inference from working

export type OptionalSchemaKeys <Schema> =
  KeysOfType<Schema, "increments" | typeof ColumnTypes["increments"]>

export type MarkOptionals <
  ModelSchema extends Schema<LooseObject>,
  ModelObject extends InferObjectShape<ModelSchema> = InferObjectShape<ModelSchema>,
  Optionals extends keyof ModelObject = OptionalSchemaKeys<ModelSchema>
> =
  Omit<ModelObject, Optionals> & Partial<Pick<ModelObject, Optionals>>

export type InferObjectShape <ModelSchema, ModelObject = LooseObject> = {
  [Property in keyof ModelSchema]: ModelSchema[Property] extends { type: infer PropertyType, defaultTo?: infer PropertyDefault }
    ? ValueOfSchemaProperty<PropertyType, ModelObject, PropertyDefault>
    : ValueOfSchemaProperty<ModelSchema[Property], ModelObject>
}
