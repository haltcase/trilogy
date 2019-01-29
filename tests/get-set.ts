import test from 'ava'
import { connect } from '../src'

import { Person } from './helpers/types'

const db = connect(':memory:')

test.before(async () => {
  await db.model('one', {
    first: String,
    second: String
  })

  await Promise.all([
    db.create('one', {
      first: 'fee',
      second: 'blah'
    }),
    db.create('one', {
      first: 'shoot',
      second: 'buckets'
    })
  ])
})

test.after.always(() => db.close())

test('get() - retrieves a specific property of the object', async t => {
  const res = await db.get('one.second', { first: 'fee' })
  t.is(res, 'blah')
})

test('get() - is undefined when no value at the path exists', async t => {
  const noRow = await db.get('one.second', { first: 'worst' })
  const noColumn = await db.get('one.third', { first: 'fee' })
  t.is(noRow, undefined)
  t.is(noColumn, undefined)
})

test('get() - returns the provided default value when target is undefined', async t => {
  const noRow = await db.get('one.second', { first: 'worst' }, 'nothing')
  t.is(noRow, 'nothing')
})

test('set() - updates the target value', async t => {
  const expected = 'some super new value'
  await db.set('one.second', { first: 'shoot' }, expected)

  const actual = await db.get('one.second', { first: 'shoot' })
  t.is(actual, expected)
})

test('model.get() & model.set()', async t => {
  const people = await db.model<Person>('get_set_people', {
    name: String,
    age: Number
  })

  const persons = [
    { name: 'Dale', age: 30 },
    { name: 'Lelu', age: 6 },
    { name: 'Gurlak', age: 302 }
  ]

  await Promise.all(persons.map(p => people.create(p)))

  const actual = await people.get('age', { name: 'Dale' })
  t.is(actual, 30)

  await people.set('age', { name: 'Dale' }, 32)
  t.is(await people.get('age', { name: 'Dale' }), 32)
})
