import Trilogy from '../dist/trilogy'

import test from 'ava'
import rimraf from 'rimraf'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

test.after.always('remove test database file', () => {
  return db.close().then(() => rimraf.sync(filePath))
})

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

  let object = { name: 'coke', flavor: 'awesome' }
  await db.create('sodas', object)
  await db.create('sodas', object)

  t.is(await db.count('sodas', { name: 'coke' }), 1)
})
