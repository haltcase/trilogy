import test from 'ava'
import Trilogy from '../dist/trilogy'

const db = new Trilogy(':memory:')

const arr = ['fee', 'fi', 'fo', 'fum']

test.before(async () => {
  await db.model('select', {
    first: String,
    second: String
  })

  return Promise.all(
    arr.map(v => db.create('select', { first: v, second: 'blah' }))
  )
})

test.after.always(() => db.close())

test('retrieves rows as arrays of objects', async t => {
  const res = await db.find('select')

  t.true(Array.isArray(res))
  res.forEach((obj, i) => t.is(obj.first, arr[i]))
})

test('allows for multiple where clauses', async t => {
  const people = await db.model('find_people', {
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

  const found = await people.find([
    ['age', '>', 50],
    { gender: 'female' }
  ])

  t.is(found.length, 1)
  t.deepEqual(found, [{ age: 51, gender: 'female' }])
})
