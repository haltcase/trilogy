import * as t from "runtypes"

import { ColumnType } from "./column-types"
import * as T from "./column-types"

import { isFunction } from "../util"

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

export const ColumnKind = t.Union(t.String, t.Function)
  .withConstraint<NonNullable<ColumnType>>(value => {
    const type = isFunction(value)
      ? value.name
      : value

    return [
      T.Array,
      T.Boolean,
      T.Date,
      T.Increments,
      T.Json,
      T.Number,
      T.Object,
      T.String
    ].includes(type.toLowerCase() as Extract<ColumnType, string>)
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
