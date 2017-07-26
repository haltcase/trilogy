import test from 'ava'
import Trilogy from '../dist/trilogy'

const db = new Trilogy(':memory:')

const people = [
  { name: 'Dale', age: 30 },
  { name: 'Lelu', age: 6 },
  { name: 'Gurlak', age: 302 }
]

test.before(async () => {
  await db.model('people', {
    name: { type: String, primary: true },
    age: Number
  })

  return Promise.all(people.map(person => db.create('people', person)))
})

test.after.always(() => db.close())

test('returns the total number of rows', async t => {
  const res = await db.count('people')
  t.is(res, 3)
})

test('returns the number of matching rows', async t => {
  const res = await db.count('people', ['age', '<', 200])
  t.is(res, 2)
})

test('allows for multiple where clauses', async t => {
  const res = await db.count('people', [
    ['age', '<', 200],
    ['age', '>', 20]
  ])

  t.is(res, 1)
})
