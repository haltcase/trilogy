import { dirname } from 'path'
import { mkdirSync, statSync } from 'fs'
import type from 'component-type'

export const map = (object, fn) => each(object, fn, true)

export function each (object, fn, map) {
  if (isObject(object)) {
    if (map) {
      const res = {}

      Object.keys(object).forEach(key => {
        res[key] = fn.call(object, object[key], key, object)
      })

      return res
    } else {
      Object.keys(object).forEach(key => {
        fn.call(object, object[key], key, object)
      })
    }
  } else if (isArray(object)) {
    const method = map ? 'map' : 'forEach'
    return object[method](fn)
  } else {
    return object
  }
}

export function isOneOf (array, value) {
  return array.some(v => v === value)
}

export let isType = (value, kind) => {
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
