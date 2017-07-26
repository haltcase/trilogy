import test from 'ava'
import Trilogy from '../dist/trilogy'

const db = new Trilogy(':memory:')

test.after.always(() => db.close())

test('creates a new model definition', async t => {
  await db.model('teams', {
    name: String,
    playoffs: { type: Boolean, defaultTo: false }
  })

  t.true(await db.hasModel('teams'))
})

test('defines a model with a uniquely constrained property', async t => {
  await db.model('sodas', {
    name: { type: String, unique: true },
    flavor: String
  })

  const object = { name: 'coke', flavor: 'awesome' }
  await db.create('sodas', object)
  await db.create('sodas', object)

  t.is(await db.count('sodas', { name: 'coke' }), 1)
})
