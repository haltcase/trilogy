import test from 'ava'
import { connect } from '../../src'

const db = connect(':memory:')

test.before(async () => {
  const tests = await db.model('tests', {
    id: 'increments',
    item: String
  }, {
    timestamps: true
  })

  await tests.create({
    item: 'test'
  })
})

test.after.always(() => db.close())

test('timestamp fields are available on created objects', async t => {
  const found = await db.findOne('tests', { item: 'test' })
  t.true(found.created_at instanceof Date)
  t.true(found.updated_at instanceof Date)
})
