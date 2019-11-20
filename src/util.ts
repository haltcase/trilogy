import { dirname } from 'path'
import { mkdirSync, statSync } from 'fs'

import * as types from './types'

export function mapObj <T extends types.LooseObject, R extends T> (
  collection: T,
  fn: (value: T[keyof T], key: keyof T) => R[keyof R]
): R {
  const result = {} as R

  for (const [key, value] of Object.entries(collection)) {
    result[key as keyof R] = fn(value, key)
  }

  return result
}

export const isObject = (value: any): value is types.LooseObject =>
  (value?.constructor === Object) || false

export const isFunction = (value: any): value is Function => typeof value === 'function'
export const isString = (value: any): value is string => typeof value === 'string'
export const isNumber = (value: any): value is number => typeof value === 'number'
export const isNil = (value: any): value is undefined | null => value == null

export const isEmpty = (value: any): boolean => {
  if (isNil(value)) return true
  if (Array.isArray(value)) return value.length === 0
  if (isObject(value)) return Object.keys(value).length === 0

  return false
}

export const toArray = <T> (value: T | T[]): NonNullable<T>[] =>
  Array.isArray(value)
    ? value as NonNullable<T>[]
    : isNil(value)
      ? []
      : [value as NonNullable<T>]

export const firstOrValue = <T> (value: T | T[]): T =>
  Array.isArray(value) ? value[0] : value

export type Falsy = false | null | undefined | 0 | ''

export function invariant (condition: Falsy, message?: string): never
export function invariant <T> (condition: T, message?: string): T
export function invariant <T> (condition: T | Falsy, message?: string): T | never {
  if (!condition) {
    throw new Error(message || 'Invariant Violation')
  }

  return condition
}

export function makeDirPath (path: string): boolean {
  const mode = parseInt('0777', 8)

  try {
    mkdirSync(path, mode)
    return true
  } catch (err) {
    if (err.code === 'EEXIST') {
      return statSync(path).isDirectory()
    }

    if (err.code === 'ENOENT') {
      const target = dirname(path)
      return (
        target !== path &&
        makeDirPath(target) &&
        (Boolean(mkdirSync(path, mode)) || true)
      )
    }

    return false
  }
}
