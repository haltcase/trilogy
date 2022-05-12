import test from 'ava'
import { connect } from '../../src'

const db = connect(':memory:')

test.before(async () => {
  await db.model('tests', {
    id: { type: Number, primary: true },
    item: String
  }, {
    timestamps: true
  })
})

test.after.always(() => db.close())

test('timestamp fields are updated properly by their triggers', async t => {
  const model = await db.model('tests', {
    id: { type: Number, primary: true },
    item: String
  }, {
    timestamps: true
  })

  await model.create({ id: 1, item: 'test1' })
  await model.update({ id: 1 }, { item: 'test2' })

  const result = await model.findOne({ id: 1 })
  t.true(result != null)
  t.true(result?.created_at instanceof Date)
  t.true(result?.updated_at instanceof Date)
  t.is(result?.item, "test2")
})
