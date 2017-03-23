import Trilogy from '../dist/trilogy'

import test from 'ava'
import rimraf from 'rimraf'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

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

test.after.always('remove test database file', () => {
  return db.close().then(() => rimraf.sync(filePath))
})

test('is true for existing tables', t => {
  return Promise.all(
    tables.map(async ({ name }) => t.true(await db.hasModel(name)))
  )
})

test('is false for non-existent tables', async t => {
  let noTables = ['four', 'five', 'six']
  return Promise.all(
    noTables.map(async table => t.false(await db.hasModel(table)))
  )
})
