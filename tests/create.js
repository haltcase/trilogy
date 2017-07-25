import test from 'ava'
import Trilogy from '../dist/trilogy'

const db = new Trilogy(':memory:')

const schema = {
  first: String,
  second: Number
}

const tables = [
  { name: 'one', schema },
  { name: 'two', schema },
  { name: 'three', schema }
]

test.before(() => {
  return Promise.all(tables.map(table => {
    return db.model(table.name, table.schema)
  }))
})

test.after.always(() => db.close())

test('inserts objects into the database', async t => {
  let inserts = [
    { table: 'one', object: { first: 'hello', second: 1 } },
    { table: 'two', object: { first: 'hello', second: 2 } },
    { table: 'three', object: { first: 'hello', second: 3 } }
  ]

  await Promise.all(
    inserts.map(({ table, object }) => db.create(table, object))
  )

  let selects = await Promise.all(
    inserts.map(({ table, object }) => db.find(table, object))
  )

  inserts.forEach(({ table, object }, i) => {
    t.deepEqual(selects[i], [object])
  })
})
