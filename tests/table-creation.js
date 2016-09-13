import Trilogy from '../dist/trilogy'

import test from 'ava'
import { basename } from 'path'
import { remove } from 'fs-jetpack'

const filePath = `${basename(__filename, '.js')}.db`
const db = new Trilogy(filePath)

test.after.always('remove test database file', () => remove(filePath))

test('adds a table to the database', async t => {
  await db.createTable('people', [
    { name: 'name' },
    { name: 'age', type: 'integer' }
  ])

  t.true(await db.hasTable('people'))
})

test('adds a table with a uniquely constrained column', async t => {
  await db.createTable('sodas', [
    { name: 'name', unique: true },
    { name: 'flavor' }
  ])

  await db.insert('sodas', { name: 'coke', flavor: 'awesome' })

  t.throws(db.insert('sodas', { name: 'coke', flavor: 'awesome' }), Error)
})
