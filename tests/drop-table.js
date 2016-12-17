import Trilogy from '../dist/trilogy'

import test from 'ava'
import { remove } from 'fs-jetpack'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
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

test('removes tables from the database', t => {
  tables.map(async table => {
    await db.dropTable(table.name)
    t.false(await db.hasTable(table.name))
  })
})
