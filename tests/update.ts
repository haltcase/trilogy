import test from 'ava'
import { connect } from '../src'

import { Person2 } from './helpers/types'

const db = connect(':memory:')

test.before(async () => {
  await db.model('one', {
    first: String,
    second: String,
    third: Boolean,
    array: Array
  })

  return Promise.all([
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

test.after.always(() => db.close())

test('changes the value of an existing key', async t => {
  await db.update('one', { first: 'fee' }, { second: 'blurg' })
  const res = await db.get('one.second', { first: 'fee' })
  t.is(res, 'blurg')
})

test('handles model type definitons correctly', async t => {
  await db.update('one', { third: false }, { array: [4, 5, 6] })
  const res = await db.get('one.array', { third: false })
  t.deepEqual(res, [4, 5, 6])
})

test('allows for using multiple where clauses', async t => {
  const people = await db.model<Person2>('update_people', {
    age: Number,
    gender: String
  })

  const list = [
    { age: 31, gender: 'male' },
    { age: 51, gender: 'male' },
    { age: 51, gender: 'female' },
    { age: 49, gender: 'female' }
  ]

  await Promise.all(list.map(p => people.create(p)))

  const affected = await people.update([
    ['age', '>', 45],
    { gender: 'female' }
  ], { gender: 'male' })

  const results = await people.find([
    ['age', '>', 45],
    { gender: 'male' }
  ])

  t.is(affected, 2)
  t.is(results.length, 3)
  t.deepEqual(results, [
    { age: 51, gender: 'male' },
    { age: 51, gender: 'male' },
    { age: 49, gender: 'male' }
  ])
})
