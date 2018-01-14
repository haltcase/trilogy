import test from 'ava'
import { create } from '../src'

const db = create(':memory:')

test.before(async () => {
  await db.model('one', {
    first: String,
    second: String
  })

  return Promise.all([
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
