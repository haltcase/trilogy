import Trilogy from '../dist/trilogy'

import test from 'ava'
import { basename } from 'path'
import { remove } from 'fs-jetpack'

const filePath = `${basename(__filename, '.js')}.db`
const db = new Trilogy(filePath)

const people = [
  { name: 'Dale', age: 30 },
  { name: 'Lelu', age: 6 },
  { name: 'Gurlak', age: 302 }
]

test.before(async () => {
  await db.createTable('people', [
    'name',
    { name: 'age', type: 'integer' }
  ])

  people.forEach(async person => await db.insert('people', person))
})

test.after.always('remove test database file', () => remove(filePath))

test('returns the total number of rows', async t => {
  let res = await db.count('people')
  t.is(res, 3)
})

test('returns the number of matching rows', async t => {
  let res = await db.count('people', ['age', '<', '200'])
  t.is(res, 2)
})
