import test from 'ava'
import { connect } from '../src'

const db = connect(':memory:')

const schema = { name: String }

const tables = [
  { name: 'one', schema },
  { name: 'two', schema },
  { name: 'three', schema }
]

test.before(() => {
  return Promise.all(
    tables.map(table => db.model(table.name, table.schema))
  )
})

test.after.always(() => db.close())

test('removes tables from the database', async t => {
  const removals = await Promise.all(
    tables.map(({ name }) => {
      return db.dropModel(name).then(() => db.hasModel(name))
    })
  )

  removals.forEach(v => t.false(v))
})
