import { dirname } from 'path'
import { mkdirSync, statSync } from 'fs'

import * as types from './types'

export function eachObj <T extends types.LooseObject, K extends types.StringKeys<T>> (
  collection: T,
  fn: (value: T[K], key: K, collection: T) => any
) {
  const keys = Object.keys(collection)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = collection[key]
    if (fn(value, key as K, collection) === false) break
  }
}

export function mapObj <T extends types.LooseObject, K extends types.StringKeys<T>, U> (
  collection: T,
  fn: (value: T[K], key: K, collection: T) => U
): Record<K, U> {
  const result = {} as Record<K, U>
  eachObj<T, K>(collection, (value, key, collection) => {
    result[key] = fn(value, key, collection)
  })

  return result
}

export const isObject = (value: any): value is types.LooseObject =>
  (value && value.constructor === Object) || false

export const isFunction = (value: any): value is Function => typeof value === 'function'
export const isString = (value: any): value is string => typeof value === 'string'
export const isNumber = (value: any): value is number => typeof value === 'number'
export const isNil = (value: any): value is undefined | null => value == null

export const toArray = <T> (value: T | T[]): T[] =>
  Array.isArray(value) ? value : isNil(value) ? [] : [value]

export const defaultTo = <T, V> (value: T | null | undefined, fallback: V) =>
  isNil(value) ? fallback : value

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
        (mkdirSync(path, mode) || true)
      )
    }

    return false
  }
}