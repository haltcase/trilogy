import test from 'ava'
import { create } from '../src'

const db = create(':memory:')

test.before(async () => {
  await db.model('first', {
    first: String,
    second: String
  })

  return db.create('first', {
    first: 'fee',
    second: 'blah'
  })
})

test.after.always(() => db.close())

test('retrieves a single object', async t => {
  const expected = { first: 'fee', second: 'blah' }
  const res = await db.findOne('first')
  t.deepEqual(res, expected)
})

test('allows retrieving a specific property', async t => {
  const res = await db.findOne('first.second')
  t.deepEqual(res, 'blah')
})

test('allows for multiple where clauses', async t => {
  const people = await db.model('findOne_people', {
    age: Number,
    gender: String
  })

  const list = [
    { age: 31, gender: 'male' },
    { age: 41, gender: 'male' },
    { age: 51, gender: 'female' },
    { age: 49, gender: 'female' }
  ]

  await Promise.all(list.map(p => people.create(p)))

  const found = await people.findOne([
    ['age', '>', 50],
    { gender: 'female' }
  ])

  t.deepEqual(found, { age: 51, gender: 'female' })
})
