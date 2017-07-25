import test from 'ava'
import Trilogy from '../dist/trilogy'

const db = new Trilogy(':memory:')

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
  let res = await db.get('one.second', { first: 'fee' })
  t.is(res, 'blah')
})

test('get() - is undefined when no value at the path exists', async t => {
  let noRow = await db.get('one.second', { first: 'worst' })
  let noColumn = await db.get('one.third', { first: 'fee' })
  t.is(noRow, undefined)
  t.is(noColumn, undefined)
})

test('get() - returns the provided default value when target is undefined', async t => {
  let noRow = await db.get('one.second', { first: 'worst' }, 'nothing')
  t.is(noRow, 'nothing')
})

test('set() - updates the target value', async t => {
  let expected = 'some super new value'
  await db.set('one.second', { first: 'shoot' }, expected)

  let actual = await db.get('one.second', { first: 'shoot' })
  t.is(actual, expected)
})
