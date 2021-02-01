export type Array = typeof Array
export type Boolean = typeof Boolean
export type Date = typeof Date
export type Increments = typeof Increments
export type Json = typeof Json
export type Number = typeof Number
export type Object = typeof Object
export type String = typeof String

/**
 * The set of runtime types allowed in a column.
 */
export type ColumnType =
  | null
  | undefined
  /* eslint-disable-next-line @typescript-eslint/array-type */
  | Array
  | Boolean
  | Date
  | Increments
  | Json
  | Number
  | Object
  | String

/* eslint-disable @typescript-eslint/no-redeclare */
export const Array = "array" as const
export const Boolean = "boolean" as const
export const Date = "date" as const
export const Increments = "increments" as const
export const Json = "json" as const
export const Number = "number" as const
export const Object = "object" as const
export const String = "string" as const
/* eslint-enable @typescript-eslint/no-redeclare */
