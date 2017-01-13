import type from 'component-type'

export let map = (object, fn) => each(object, fn, true)

export function each (object, fn, map) {
  if (isObject(object)) {
    if (map) {
      let res = {}

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
    let method = map ? 'map' : 'forEach'
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

export let isArray = value => isType(value, 'array')
export let isObject = value => isType(value, 'object')
export let isFunction = value => isType(value, 'function')
export let isString = value => isType(value, 'string')
export let isNumber = value => isType(value, 'number')
export let isBoolean = value => isType(value, 'boolean')

export function invariant (condition, message) {
  if (!condition) {
    let error = new Error(message || 'Invariant Violation')
    error.name = 'InvariantError'
    error.framesToPop = 1
    throw error
  } else {
    return condition
  }
}
