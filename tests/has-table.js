import Trilogy from '../dist/trilogy'

import test from 'ava'
import { basename } from 'path'
import { remove } from 'fs-jetpack'

const filePath = `${basename(__filename, '.js')}.db`
const db = new Trilogy(filePath)

const columns = ['name']

const tables = [
  { name: 'one', columns },
  { name: 'two', columns },
  { name: 'three', columns }
]

test.before(() => {
  return Promise.all(tables.map(table => {
    db.createTable(table.name, table.columns)
  }))
})

test.after.always('remove test database file', () => remove(filePath))

test('is true for existing tables', t => {
  tables.map(async table => t.true(await db.hasTable(table.name)))
})

test('is false for non-existent tables', async t => {
  let noTables = ['four', 'five', 'six']
  noTables.map(async table => t.false(await db.hasTable(table)))
})
