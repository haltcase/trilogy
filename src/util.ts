import { dirname } from 'path'
import { mkdirSync, statSync } from 'fs'

import * as types from './types'

export function eachObj <T extends object> (
  collection: T,
  fn: (value: T[keyof T], key: string, collection: T) => any
) {
  const keys = Object.keys(collection)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = collection[key]
    if (fn(value, key, collection) === false) break
  }
}

export function mapObj <T extends object> (
  collection: T,
  fn: (value: T[keyof T], key: string, collection: T) => any
): { [key: string]: T[keyof T] } {
  const result = {}
  eachObj(collection, (value, key, collection) => {
    result[key] = fn(value, key, collection)
  })

  return result
}

export const isObject = (value): value is types.ObjectLiteral =>
  (value && value.constructor === Object) || false

export const isFunction = (value): value is Function => typeof value === 'function'
export const isString = (value): value is string => typeof value === 'string'
export const isNumber = (value): value is number => typeof value === 'number'
export const isNil = (value): value is undefined | null => value == null

export const defaultTo = <T, V> (value: T, fallback: V) => isNil(value) ? fallback : value

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
