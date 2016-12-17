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
  } else if (Array.isArray(object)) {
    let method = map ? 'map' : 'forEach'
    return object[method](fn)
  }
}

export function isObject (value) {
  return value === Object(value) && !Array.isArray(value)
}

const objToStr = Object.prototype.toString

export function isFunction (value) {
  let type = isObject(value) ? objToStr.call(value) : ''
  return type === '[object Function]' || type === '[object GeneratorFunction]'
}

export function isString (value) {
  let type = typeof value
  if (type == null) return false

  return type === 'string' || (!Array.isArray(value) &&
    type === 'object' && objToStr.call(value) === '[object String]')
}

export function isBoolean (value) {
  return value === true || value === false
}
