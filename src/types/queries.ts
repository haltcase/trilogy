import { QueryBuilder, Raw, SchemaBuilder } from "knex"

import { Driver } from "../constants"
import { Model } from "../model"

import { Schema } from "./schemas"

export interface QueryOptions <
  QueryModel extends Model<Schema>
> {
  model?: QueryModel
  needResponse?: boolean
  internal?: boolean
}

export type Query =
  | Raw<any>
  | QueryBuilder<any, any>
  | SchemaBuilder

export type QueryLike = Query | Promise<boolean>

export type QueryResult <
  DriverType extends Driver = Driver.native,
  Q extends QueryLike = Query
> =
  DriverType extends Driver.native
    ? Query
    : Q extends Promise<boolean>
      ? boolean
      : unknown[]
