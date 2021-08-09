import { ColumnTypes } from "../../src/constants"

export interface Person4 {
  name: ColumnTypes.string,
  age: ColumnTypes.number
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

export interface Game {
  name: string
  last_played: Date
  genre: string
}

export interface User {
  name: string
  rank: number
}
