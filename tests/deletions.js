import Trilogy from '../dist/trilogy'

import test from 'ava'
import { remove } from 'fs-jetpack'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath, {
  // verbose: console.log
})

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

test.after.always('remove test database file', () => {
  return db.close().then(() => remove(filePath))
})

test.serial('removes an object from the specified model', async t => {
  return Promise.all(somePeople.map(({ name }) => {
    return db.remove('others', { name })
      .then(() => db.findOne('others', { name }))
      .then(res => t.falsy(res))
  }))
})

test.serial('removes all objects from the specified model', async t => {
  await db.clear('people')

  let values = await Promise.all([
    db.count('people'),
    ...morePeople.map(({ name }) => {
      return db.findOne('people', { name })
    })
  ])

  values.forEach(value => t.falsy(value))
})
