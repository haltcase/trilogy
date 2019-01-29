import test from 'ava'
import { connect } from '../src'

const db = connect(':memory:')

const persons = [
  { name: 'Dale', age: 30 },
  { name: 'Lelu', age: 6 },
  { name: 'Gurlak', age: 302 }
]

test.before(async () => {
  await db.model('people', {
    name: { type: String, primary: true },
    age: Number
  })

  await Promise.all(persons.map(person => db.create('people', person)))
})

test.after.always(() => db.close())

test('returns the number of models when parameter count === 0', async t => {
  t.is(await db.count(), 1)
  await db.model('count_crayons', { color: String })
  t.is(await db.count(), 2)
})

test('returns the total number of rows', async t => {
  const res = await db.count('people')
  t.is(res, 3)
})

test('returns the number of matching rows', async t => {
  const res = await db.count('people', ['age', '<', 200])
  t.is(res, 2)
})

test('allows for multiple where clauses', async t => {
  const res = await db.count('people', [
    ['age', '<', 200],
    ['age', '>', 20]
  ])

  t.is(res, 1)
})

test('countIn() variant counts on the given column', async t => {
  const db = connect(':memory:')

  type Person = {
    name: string,
    // allow null in order to test that null values
    // in the target column aren't counted
    age: number | null
  }

  const people = await db.model<Person>('people', {
    name: { type: String, primary: true },
    age: Number
  })

  await Promise.all(persons.map(async person => people.create(person)))
  await people.create({ name: '', age: null })

  const res = await people.countIn('age')

  t.is(res, persons.length)
})
