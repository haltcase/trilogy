const objToStr = Object.prototype.toString

function isObject (value: mixed): boolean {
  const type = typeof value
  return value && (type === 'object' || type === 'function')
}

function isFunction (value: mixed): boolean {
  const type = isObject(value) ? objToStr.call(value) : ''
  return type === '[object Function]' || type === '[object GeneratorFunction]'
}

function isString (value: mixed): boolean {
  const type = typeof value
  if (type == null) return false

  return type === 'string' || (!Array.isArray(value) &&
    type === 'object' && objToStr.call(value) === '[object String]')
}

export {
  isFunction,
  isObject,
  isString
}
