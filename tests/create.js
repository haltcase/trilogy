import Trilogy from '../dist/trilogy'

import test from 'ava'
import rimraf from 'rimraf'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

const schema = {
  first: String,
  second: Number
}

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

test('inserts objects into the database', async t => {
  let inserts = [
    { table: 'one', object: { first: 'hello', second: 1 } },
    { table: 'two', object: { first: 'hello', second: 2 } },
    { table: 'three', object: { first: 'hello', second: 3 } }
  ]

  await Promise.all(
    inserts.map(({ table, object }) => db.create(table, object))
  )

  inserts.forEach(async ({ table, object }) => {
    t.deepEqual(await db.find(table, object), [object])
  })
})
