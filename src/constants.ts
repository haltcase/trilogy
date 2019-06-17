export const COLUMN_TYPES = new Set([
  'increments',
  'array',
  'object',
  'json',
  'string',
  'number',
  'boolean',
  'date'
])

export const KNEX_NO_ARGS = new Set([
  'primary',
  'unique',
  'notNullable'
])

export const IGNORABLE_PROPS = new Set([
  'name',
  'nullable',
  'type',
  'get',
  'set'
])
