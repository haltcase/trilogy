import Trilogy from '../dist/trilogy'

import test from 'ava'
import rimraf from 'rimraf'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

test.before(async () => {
  await db.model('first', {
    first: String,
    second: String
  })

  await db.create('first', {
    first: 'fee',
    second: 'blah'
  })
})

test.after.always('remove test database file', () => {
  return db.close().then(() => rimraf.sync(filePath))
})

test('retrieves a single object', async t => {
  let expected = { first: 'fee', second: 'blah' }
  let res = await db.findOne('first')
  t.deepEqual(res, expected)
})

test('allows retrieving a specific property', async t => {
  let res = await db.findOne('first.second')
  t.deepEqual(res, 'blah')
})

test('allows for multiple where clauses', async t => {
  let people = await db.model('findOne_people', {
    age: Number,
    gender: String
  })

  let list = [
    { age: 31, gender: 'male' },
    { age: 41, gender: 'male' },
    { age: 51, gender: 'female' },
    { age: 49, gender: 'female' }
  ]

  await Promise.all(list.map(p => people.create(p)))

  let found = await people.findOne([
    ['age', '>', 50],
    { gender: 'female' }
  ])

  t.deepEqual(found, { age: 51, gender: 'female' })
})
