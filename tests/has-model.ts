import test from 'ava'
import { create } from '../src'

const db = create(':memory:')

const schema = { name: String }

const tables = [
  { name: 'one', schema },
  { name: 'two', schema },
  { name: 'three', schema }
]

test.before(() => {
  return Promise.all(tables.map(table => {
    return db.model(table.name, table.schema)
  }))
})

test.after.always(() => db.close())

test('is true for existing tables', t => {
  return Promise.all(
    tables.map(async ({ name }) => t.true(await db.hasModel(name)))
  )
})

test('is false for non-existent tables', async t => {
  const noTables = ['four', 'five', 'six']
  return Promise.all(
    noTables.map(async table => t.false(await db.hasModel(table)))
  )
})
