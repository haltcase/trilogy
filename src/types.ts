import Model from './model'

import * as t from 'io-ts'
import { ThrowReporter } from 'io-ts/lib/ThrowReporter'

import { COLUMN_TYPES } from './constants'
import { isFunction } from './util'

import {
  Raw,
  SchemaBuilder,
  QueryBuilder
} from 'knex'

import { Either } from 'fp-ts/lib/Either'

export const raise: (
  validation: Either<t.ValidationError[], any>
) => void = ThrowReporter.report

export function validate <L> (value: L, type: t.Type<L>, defaultValue: L = {} as L): L {
  const result = type.decode(value)
  raise(result)
  return result.getOrElse(defaultValue)
}

// based on `withDefault` from io-ts tests: https://git.io/vNGS6
export function withDefault <T extends t.Mixed> (
  type: T,
  defaultValue: (() => t.TypeOf<T>) | t.TypeOf<T>
): t.Type<t.TypeOf<T>, t.TypeOf<T>> {
  const value = isFunction(defaultValue)
    ? defaultValue()
    : defaultValue

  return new t.Type(
    `withDefault(${type.name}, ${JSON.stringify(value)})`,
    type.is,
    (v, c) => type.validate(v != null ? v : value, c),
    type.encode
  )
}

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

export const Index = t.union([
  t.string,
  t.array(t.union([t.string, t.array(t.string)])),
  t.dictionary(t.string, t.union([t.string, t.array(t.string)]))
])

export const GroupClause = t.union([
  t.string,
  t.array(t.string)
])

export const OrderClause = t.union([
  t.string,
  t.tuple([t.string, t.string])
])

export const TrilogyOptions = t.partial({
  client: withDefault(
    t.union([t.literal('sqlite3'), t.literal('sql.js')]),
    'sqlite3'
  ),
  connection: withDefault(t.partial({
    filename: t.string
  }), {}),
  dir: withDefault(t.string, process.cwd),
})

export const ModelOptions = t.partial({
  index: Index,
  primary: t.array(t.string),
  unique: t.array(t.string),
  timestamps: t.boolean
})

export const AggregateOptions = t.partial({
  distinct: t.boolean,
  group: GroupClause,
  order: OrderClause
})

export const CreateOptions = t.partial({
  raw: t.boolean
})

export const FindOptions = t.partial({
  limit: t.number,
  order: OrderClause,
  random: t.boolean,
  raw: t.boolean,
  skip: t.number
})

export const UpdateOptions = t.partial({
  raw: t.boolean
})

export const ColumnKind = t.refinement(
  t.union([t.string, t.Function]),
  value => {
    const type = isFunction(value) ? value.name : String(value)
    return COLUMN_TYPES.has(type.toLowerCase())
  }
)

export const ColumnDescriptor = t.partial({
  defaultTo: t.unknown,
  index: t.string,
  notNullable: t.boolean,
  nullable: t.boolean,
  primary: t.boolean,
  unique: t.boolean,
  type: ColumnKind,
  get: t.Function,
  set: t.Function
})

export type Index = t.TypeOf<typeof Index>
export type Order = t.TypeOf<typeof OrderClause>
export type Group = t.TypeOf<typeof GroupClause>

export type TrilogyOptions = t.TypeOf<typeof TrilogyOptions>
export type ModelOptions = t.TypeOf<typeof ModelOptions>
export type AggregateOptions = t.TypeOf<typeof AggregateOptions>
export type CreateOptions = t.TypeOf<typeof CreateOptions>
export type UpdateOptions = t.TypeOf<typeof UpdateOptions>
export type FindOptions = t.TypeOf<typeof FindOptions>
export type ColumnKind = t.TypeOf<typeof ColumnKind>
export type ColumnDescriptor = t.TypeOf<typeof ColumnDescriptor>

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
