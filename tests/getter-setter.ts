import test from 'ava'
import { create } from '../src'
import { Person } from './helpers/types'

const db = create(':memory:')

test.before(async () => {
  await db.model('people', {
    name: {
      type: String,
      get: (name: string) => name.toUpperCase()
    },
    age: {
      type: Number,
      set: (age: number) => age + 1
    }
  })

  return db.create('people', {
    name: 'Joey Smith',
    age: 20
  })
})

test.after.always(() => db.close())

test('getter only alters the returned value, not the stored value', async t => {
  const [upper, lower] = await Promise.all([
    db.findOne('people', { name: 'JOEY SMITH' }),
    db.findOne('people', { name: 'Joey Smith' })
  ])

  t.is(typeof upper, 'undefined')
  t.deepEqual(lower, { name: 'JOEY SMITH', age: 21 })
})

test('setter alters the stored value after each update', async t => {
  // setters fire on object creation
  const initial = await db.get('people.age', { name: 'Joey Smith' })
  t.is(initial, 21)

  await db.update('people', { name: 'Joey Smith' }, { age: 25 })
  t.is(await db.get('people.age', { name: 'Joey Smith' }), 26)
  await db.set('people.age', { name: 'Joey Smith' }, 27)
  t.is(await db.get('people.age', { name: 'Joey Smith' }), 28)
})

test('getters & setters are not fired by `getRaw()` or `setRaw()`', async t => {
  await db.create('people', {
    name: 'John Doe',
    age: 44
  }, { raw: true })

  const initial = await db.getRaw('people.name', { age: 44 })
  t.is(initial, 'John Doe')

  const affected = await db.findOne<Person>('people', { age: 44 })
  t.is(affected.name, 'JOHN DOE')
  t.is(affected.age, 44)

  await db.setRaw('people.age', { name: 'John Doe' }, 50)
  const updated = await db.getRaw('people.age', { name: 'John Doe' })
  t.is(updated, 50)

  await db.update('people', { name: 'John Doe' }, { age: 55 })
  const final = await db.getRaw('people.age', { name: 'John Doe' })
  t.is(final, 56)
})

test('setters are not fired when `options.raw` is set', async t => {
  const options = { raw: true }

  await db.create('people', {
    name: 'Libby Wilson',
    age: 16
  }, options)

  const first = await db.get('people.age', { name: 'Libby Wilson' })
  t.is(first, 16)

  await db.update('people', { name: 'Libby Wilson' }, { age: 17 }, options)
  const second = await db.get('people.age', { name: 'Libby Wilson' })
  t.is(second, 17)
})

test('getters are not fired when `options.raw` is set', async t => {
  const options = { raw: true }

  await db.create('people', {
    name: 'A-A-ron',
    age: 99
  }, options)

  const [fired, bypassed] = await Promise.all([
    db.findOne<Person>('people', { age: 99 }),
    db.findOne<Person>('people', { age: 99 }, options)
  ])

  t.is(fired.name, 'A-A-RON')
  t.is(bypassed.name, 'A-A-ron')
})
