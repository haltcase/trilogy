import Trilogy from '../dist/trilogy'

import test from 'ava'
import { basename } from 'path'
import { remove } from 'fs-jetpack'

const filePath = `${basename(__filename, '.js')}.db`
const db = new Trilogy(filePath)

const columns = [
  { name: 'first' },
  { name: 'second', type: 'integer' }
]

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

test('inserts values into the database', async t => {
  const inserts = [
    { name: 'one', value: { first: 'hello', second: 1 } },
    { name: 'two', value: { first: 'hello', second: 2 } },
    { name: 'three', value: { first: 'hello', second: 3 } }
  ]

  await Promise.all(inserts.map(insert => db.insert(insert.name, insert.value)))

  inserts.forEach(async insert => {
    t.deepEqual(await db.select(insert.name, insert.value), [insert.value])
  })
})
