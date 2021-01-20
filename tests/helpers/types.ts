import { Schema } from "../../src"
import * as t from "../../src/column-types"

export interface SqliteMaster {
  tbl_name: string
  sql: string
}

export interface Person4 {
  name: t.String
  age: t.Number
}

export interface Person {
  name: string
  age: number
}

export interface Person2 {
  age: number
  gender: string
}

export interface Person3 {
  age: number
  favoriteColor: string
}

export interface FirstSecond {
  first: string
  second: string
}

export type FirstSecondSchema = Schema<FirstSecond>

export interface FirstSecond2 {
  first: string
  second: number
}

export type FirstSecond2Schema = Schema<FirstSecond2>

export interface Game {
  name: string
  last_played: Date
  genre: string
}

export interface User {
  name: string
  rank: number
}
