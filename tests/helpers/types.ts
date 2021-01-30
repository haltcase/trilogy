import { SchemaFromShape, ColumnType as t } from "../../src"

export type SqliteMaster = {
  tbl_name: string
  sql: string
}

export type Person4 = {
  name: t.String
  age: t.Number
}

export type Person = {
  name: string
  age: number
}

export type Person2 = {
  age: number
  gender: string
}

export type Person3 = {
  age: number
  favoriteColor: string
}

export type FirstSecond = {
  first: string
  second: string
}

export type FirstSecondSchema = SchemaFromShape<FirstSecond>

export type FirstSecond2 = {
  first: string
  second: number
}

export type FirstSecond2Schema = SchemaFromShape<FirstSecond2>

export interface Game {
  name: string
  last_played: t.Date
  genre: string
}

export interface User {
  name: string
  rank: number
}
