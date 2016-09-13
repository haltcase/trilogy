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

test.serial('increments by 1 when no amount is provied', async t => {
  people.forEach(async ({ name, age }, i) => {
    people[i].age += 1
    await db.increment('people.age', { name })
    const res = await db.getValue('people.age', { name })
    t.is(res, age + 1)
  })
})

test.serial('increments by a specified amount', async t => {
  people.forEach(async ({ name, age }, i) => {
    people[i].age += 4
    await db.increment('people.age', 4, { name })
    const res = await db.getValue('people.age', { name })
    t.is(res, age + 4)
  })
})
