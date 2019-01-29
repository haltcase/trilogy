import test from 'ava'
import { connect } from '../src'

import { Person, Person3 } from './helpers/types'

const db = connect(':memory:')

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
  const [people, others] = await Promise.all([
    db.model<Person>('people', {
      name: { type: String, primary: true },
      age: Number
    }),

    db.model<Person>('others', {
      name: { type: String, primary: true },
      age: Number
    })
  ])

  await Promise.all([
    ...somePeople.map(person => people.create(person)),
    ...morePeople.map(person => others.create(person))
  ])
})

test.after.always(() => db.close())

test.serial('removes an object from the specified model', async t => {
  await Promise.all(somePeople.map(async ({ name }) => {
    await db.remove('others', { name })
    const res = await db.findOne('others', { name })
    t.falsy(res)
  }))
})

test.serial('removes all objects from the specified model', async t => {
  await db.clear('people')

  const quantity = await db.count('people')
  t.falsy(quantity)

  const values = await Promise.all(
    morePeople.map(({ name }) => db.findOne('people', { name }))
  )

  values.forEach(value => t.falsy(value))
})

test('allows for multiple where clauses', async t => {
  const people = await db.model<Person3>('deletions_people', {
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
