import Model from './model'

import * as t from 'runtypes'

import { ColumnTypes } from './constants'
import { isFunction } from './util'

import {
  Raw,
  SchemaBuilder,
  QueryBuilder
} from 'knex'

export type Fn <T extends any[], R = any> = (...args: T) => R

export interface Thenable <T> {
  then <U> (
    onFulfilled?: (value: T) => U | Thenable<U>,
    onRejected?: (error: any) => U | Thenable<U>
  ): Thenable<U>
}

export type Query =
  | Raw
  | QueryBuilder
  | SchemaBuilder
  | Thenable<any>

export type QueryOptions <D extends ReturnDict = LooseObject> = {
  model?: Model<D>,
  needResponse?: boolean,
  internal?: boolean
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

export type Defined <T> = {
  [P in keyof T]: Exclude<T[P], undefined>
}

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
  CriteriaBase<DistinctArrayTuple<D>>[]

export type CriteriaListNormalized <D = LooseObject> =
  CriteriaBaseNormalized<DistinctArrayTuple<D>>[]

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
  client: t.Union(t.Literal('sqlite3'), t.Literal('sql.js')),
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
}, { name: 'ColumnKind' })

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

export type SchemaRaw <D = LooseObject> = {
  [P in keyof Partial<D>]: ColumnKind | ColumnDescriptor
}

export type Schema <D = LooseObject> = {
  [P in keyof Partial<D>]: ColumnDescriptor
}

export type SqlJsResponse = Array<{
  columns: string[],
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
