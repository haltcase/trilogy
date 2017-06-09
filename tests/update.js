import Trilogy from '../dist/trilogy'

import test from 'ava'
import rimraf from 'rimraf'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

test.before(async () => {
  await db.model('one', {
    first: String,
    second: String,
    third: Boolean,
    array: Array
  })

  await Promise.all([
    db.create('one', {
      first: 'fee',
      second: 'blah'
    }),
    db.create('one', {
      third: false,
      array: [1, 2, 3]
    })
  ])
})

test.after.always('remove test database file', () => {
  return db.close().then(() => rimraf.sync(filePath))
})

test('changes the value of an existing key', async t => {
  await db.update('one', { first: 'fee' }, { second: 'blurg' })
  let res = await db.get('one.second', { first: 'fee' })
  t.is(res, 'blurg')
})

test('handles model type definitons correctly', async t => {
  await db.update('one', { third: false }, { array: [4, 5, 6] })
  let res = await db.get('one.array', { third: false })
  t.deepEqual(res, [4, 5, 6])
})

test('allows for using multiple where clauses', async t => {
  let people = await db.model('update_people', {
    age: Number,
    gender: String
  })

  let list = [
    { age: 31, gender: 'male' },
    { age: 41, gender: 'male' },
    { age: 51, gender: 'female' },
    { age: 49, gender: 'female' }
  ]

  await Promise.all(list.map(p => people.create(p)))

  db.verbose = q => console.log(q)

  let affected = await people.update([
    ['age', '>', 45],
    { gender: 'female' }
  ], { gender: 'male' })

  let results = await people.find([
    ['age', '>', 45],
    { gender: 'male' }
  ])

  t.is(affected, 2)
  t.is(results.length, 2)
  t.deepEqual(results, [
    { age: 51, gender: 'male' },
    { age: 49, gender: 'male' }
  ])
})
