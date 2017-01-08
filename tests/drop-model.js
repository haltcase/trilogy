import Trilogy from '../dist/trilogy'

import test from 'ava'
import { remove } from 'fs-jetpack'
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
    db.model(table.name, table.schema)
  }))
})

test.after.always('remove test database file', () => {
  return db.close().then(() => remove(filePath))
})

test('removes tables from the database', async t => {
  let removals = await Promise.all(
    tables.map(({ name }) => {
      return db.dropModel(name).then(() => db.hasModel(name))
    })
  )

  removals.forEach(v => t.false(v))
})
