import * as types from "./types"

export const mapObj = <T extends types.LooseObject, R extends T> (
  collection: T,
  fn: (value: T[keyof T], key: keyof T) => R[keyof R]
): R => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const result = {} as R

  for (const [key, value] of Object.entries(collection)) {
    result[key as keyof R] = fn(value, key)
  }

  return result
}

export const isObject = (value: any): value is types.LooseObject =>
  (value?.constructor === Object) || false

export const isFunction = (value: any): value is Function => typeof value === "function"
export const isString = (value: any): value is string => typeof value === "string"
export const isNumber = (value: any): value is number => typeof value === "number"

export const isEmpty = (value: any): value is types.Nullable<{} | []> => {
  if (value == null) return true
  if (Array.isArray(value)) return value.length === 0
  if (isObject(value)) return Object.keys(value).length === 0

  return false
}

export const toArray = <T> (value: T | T[]): Array<NonNullable<T>> =>
  Array.isArray(value)
    ? value as Array<NonNullable<T>>
    : value == null
      ? []
      : [value as NonNullable<T>]

export const firstOrValue = <T> (value: T | T[]): T =>
  Array.isArray(value) ? value[0] : value

export function invariant (condition: unknown, message?: string): asserts condition {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!condition) {
    throw new Error(message ?? "Invariant Violation")
  }
}
