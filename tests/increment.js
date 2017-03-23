import Trilogy from '../dist/trilogy'

import test from 'ava'
import rimraf from 'rimraf'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

const people = [
  { name: 'Dale', age: 30 },
  { name: 'Lelu', age: 6 },
  { name: 'Gurlak', age: 302 }
]

test.before(async () => {
  await db.model('people', {
    name: String,
    age: Number
  })

  return Promise.all(people.map(person => db.create('people', person)))
})

test.after.always('remove test database file', () => {
  return db.close().then(() => rimraf.sync(filePath))
})

test.serial('increments by 1 when no amount is provided', async t => {
  let values = await Promise.all(
    people.map(({ name, age }, i) => {
      people[i].age += 1
      return db.incr('people.age', { name })
        .then(() => db.get('people.age', { name }))
        .then(val => [age, val])
    })
  )

  values.forEach(([age, val]) => t.is(val, age + 1))
})

test.serial('increments by a specified amount', async t => {
  let values = await Promise.all(
    people.map(({ name, age }, i) => {
      people[i].age += 4
      return db.incr('people.age', { name }, 4)
        .then(() => db.get('people.age', { name }))
        .then(val => [age, val])
    })
  )

  values.forEach(([age, val]) => t.is(val, age + 4))
})

test.serial('does nothing when passed a zero value', async t => {
  await db.set('people.age', { name: 'Lelu' }, 10)
  let original = await db.get('people.age', { name: 'Lelu' })
  t.is(original, 10)

  let affected = await db.incr('people.age', { name: 'Lelu' }, 0)
  t.is(affected, 0)

  let final = await db.get('people.age', { name: 'Lelu' })
  t.is(final, 10)
})
