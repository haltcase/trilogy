import Trilogy from '../dist/trilogy'

import test from 'ava'
import { remove } from 'fs-jetpack'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
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

test.serial('decrements by 1 when no amount is provied', async t => {
  people.forEach(async ({ name, age }, i) => {
    people[i].age -= 1
    await db.decrement('people.age', { name })
    let res = await db.getValue('people.age', { name })
    t.is(res, age - 1)
  })
})

test.serial('decrements by a specified amount', async t => {
  people.forEach(async ({ name, age }, i) => {
    people[i].age -= 4
    await db.decrement('people.age', 4, { name })
    let res = await db.getValue('people.age', { name })
    t.is(res, age - 4)
  })
})

test.serial('does not allow negative values when allowNegative is false or omitted', async t => {
  await db.insert('people', { name: 'Benjamin Button', age: 100 })
  await db.decrement('people.age', 200, { name: 'Benjamin Button' })
  let res = await db.getValue('people.age', { name: 'Benjamin Button' })
  t.is(res, 0)
})

test.serial('allows negative values when allowNegative is true', async t => {
  await db.decrement('people.age', 2, { name: 'Lelu' }, true)
  let res = await db.getValue('people.age', { name: 'Lelu' })
  t.is(res, -1)
})
