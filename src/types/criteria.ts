import { ModelRecord } from "./schemas"

export type Operator =
  | "="
  | "<>"
  | "<"
  | ">"
  | ">="
  | "<="

export type WhereEqual <T extends ModelRecord> =
  [keyof T, T[keyof T]]

export type WhereOperator <T extends ModelRecord> =
  [keyof T, Operator, T[keyof T]]

export type WhereObject <T extends ModelRecord> =
  Partial<T>

export type WhereTuple <T extends ModelRecord> =
  | WhereEqual<T>
  | WhereOperator<T>

export type Where <T extends ModelRecord> =
  | WhereTuple<T>
  | WhereObject<T>

export type WhereNormalized <T extends ModelRecord> =
  | WhereOperator<T>
  | WhereObject<T>

export type WhereList <T extends ModelRecord> =
  Array<Where<T>>

export type WhereListNormalized <T extends ModelRecord> =
  Array<WhereNormalized<T>>

export type Criteria <T extends ModelRecord> =
  | Where<T>
  | WhereList<T>

export type CriteriaNormalized <T extends ModelRecord> =
  | WhereNormalized<T>
  | WhereListNormalized<T>
