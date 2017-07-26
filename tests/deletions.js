import test from 'ava'
import Trilogy from '../dist/trilogy'

const db = new Trilogy(':memory:')

const somePeople = [
  { name: 'Dale', age: 30 },
  { name: 'Lelu', age: 6 },
  { name: 'Gurlak', age: 302 }
]

const morePeople = [
  { name: 'Lara', age: 20 },
  { name: 'Spyro', age: 18 },
  { name: 'Benjamin Button', age: 100 }
]

test.before(async () => {
  await db.model('people', {
    name: { type: String, primary: true },
    age: Number
  })

  await db.model('others', {
    name: { type: String, primary: true },
    age: Number
  })

  return Promise.all([
    ...somePeople.map(person => db.create('people', person)),
    ...morePeople.map(person => db.create('others', person))
  ])
})

test.after.always(() => db.close())

test.serial('removes an object from the specified model', async t => {
  return Promise.all(somePeople.map(({ name }) => {
    return db.remove('others', { name })
      .then(() => db.findOne('others', { name }))
      .then(res => t.falsy(res))
  }))
})

test.serial('removes all objects from the specified model', async t => {
  await db.clear('people')

  const values = await Promise.all([
    db.count('people'),
    ...morePeople.map(({ name }) => {
      return db.findOne('people', { name })
    })
  ])

  values.forEach(value => t.falsy(value))
})

test('allows for multiple where clauses', async t => {
  const people = await db.model('deletions_people', {
    age: Number,
    favoriteColor: String
  })

  const list = [
    { age: 20, favoriteColor: 'blue' },
    { age: 25, favoriteColor: 'red' },
    { age: 30, favoriteColor: 'red' },
    { age: 40, favoriteColor: 'gray' }
  ]

  await Promise.all(list.map(p => people.create(p)))

  const removed = await people.remove([
    ['age', '<', 45],
    { favoriteColor: 'red' }
  ])

  t.is(removed, 2)

  const remaining = await people.find()

  t.is(remaining.length, 2)
  t.deepEqual(remaining, [
    { age: 20, favoriteColor: 'blue' },
    { age: 40, favoriteColor: 'gray' }
  ])
})
