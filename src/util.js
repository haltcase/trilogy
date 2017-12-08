import { dirname } from 'path'
import { mkdirSync, statSync } from 'fs'
import type from 'component-type'

export function each (collection, fn) {
  const kind = type(collection)

  if (kind === 'object') {
    const keys = Object.keys(collection)

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const value = collection[key]
      if (fn(value, key, collection) === false) break
    }

    return
  }

  if (kind === 'array') {
    for (let i = 0; i < collection.length; i++) {
      const value = collection[i]
      if (fn(value, i, collection) === false) break
    }
  }
}

export function map (collection, fn) {
  const kind = type(collection)
  if (kind !== 'object' && kind !== 'array') {
    return collection
  }

  const result = kind === 'array' ? [] : {}
  each(collection, (value, key, collection) => {
    result[key] = fn(value, key, collection)
  })

  return result
}

export function includes (array, value) {
  return array.indexOf(value) !== -1
}

export const isType = (value, kind) => {
  if (!kind) return type(value)
  return type(value) === kind.toLowerCase()
}

export const isArray = value => isType(value, 'array')
export const isObject = value => isType(value, 'object')
export const isFunction = value => isType(value, 'function')
export const isString = value => isType(value, 'string')
export const isNumber = value => isType(value, 'number')
export const isBoolean = value => isType(value, 'boolean')
export const isNil = value => value == null

export function invariant (condition, message) {
  if (!condition) {
    const error = new Error(message || 'Invariant Violation')
    error.name = 'InvariantError'
    error.framesToPop = 1
    throw error
  } else {
    return condition
  }
}

export function makeDirPath (path, options) {
  options = Object.assign({
    mode: parseInt('0777', 8)
  }, options)

  try {
    mkdirSync(path, options.mode)
    return true
  } catch (err) {
    if (err.code === 'EEXIST') {
      return statSync(path).isDirectory()
    }

    if (err.code === 'ENOENT') {
      const target = dirname(path)
      return (
        target !== path &&
        makeDirPath(target, options) &&
        mkdirSync(path, options.mode)
      )
    }

    return false
  }
}
