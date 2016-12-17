import Trilogy from '../dist/trilogy'

import test from 'ava'
import { basename } from 'path'
import { remove } from 'fs-jetpack'

const filePath = `${basename(__filename, '.js')}.db`
const db = new Trilogy(filePath)

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
  await db.createTable('people', [
    'name',
    { name: 'age', type: 'integer' }
  ])

  let arr = [...somePeople, ...morePeople]
  arr.forEach(async person => await db.insert('people', person))
})

test.after.always('remove test database file', () => remove(filePath))

test.serial('removes a row from the specified table', async t => {
  somePeople.forEach(async ({ name }) => {
    await db.del('people', { name })
    let res = await db.first('people', { name })
    t.falsy(res)
  })
})

test.serial('removes all rows from the specified table', async t => {
  await db.del('people')

  morePeople.forEach(async ({ name }) => {
    const res = await db.first('people', { name })
    t.falsy(res)
  })
})
