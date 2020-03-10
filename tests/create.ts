import test from 'ava'
import { connect } from '../src'

const db = connect(':memory:')

const schema = {
  first: String,
  second: Number
}

const tables = [
  { name: 'one', schema },
  { name: 'two', schema },
  { name: 'three', schema }
]

test.before(async () => {
  await Promise.all(tables.map(table => {
    return db.model(table.name, table.schema)
  }))
})

test.after.always(() => db.close())

test('create: inserts objects into the database', async t => {
  const inserts = [
    { table: 'one', object: { first: 'hello', second: 1 } },
    { table: 'two', object: { first: 'hello', second: 2 } },
    { table: 'three', object: { first: 'hello', second: 3 } }
  ]

  await Promise.all(
    inserts.map(({ table, object }) => db.create(table, object))
  )

  const selects = await Promise.all(
    inserts.map(({ table, object }) => db.find(table, object))
  )

  inserts.forEach(({ table, object }, i) => {
    t.deepEqual(selects[i], [object])
  })
})

test('create: handles nil values correctly', async t => {
  // in TypeScript code with a type provided, these are compile time errors

  const [one, two] = await Promise.all([
    db.model('people_one', {
      name: { type: String }
    }),
    db.model('people_two', {
      name: { type: String, notNullable: true }
    })
  ])

  await one.create({ name: null })
  t.deepEqual(await one.findOne(), { name: null })

  await t.throwsAsync(
    () => two.create({ name: null }),
    { message: 'people_two.name is not nullable but received nil' }
  )

  await t.throwsAsync(
    () => two.create({ name: undefined }),
    { message: 'people_two.name is not nullable but received nil' }
  )
})
