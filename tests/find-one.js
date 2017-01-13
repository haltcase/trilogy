import Trilogy from '../dist/trilogy'

import test from 'ava'
import { remove } from 'fs-jetpack'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

test.before(async () => {
  await db.model('first', {
    first: String,
    second: String
  })

  await db.create('first', {
    first: 'fee',
    second: 'blah'
  })
})

test.after.always('remove test database file', () => {
  return db.close().then(() => remove(filePath))
})

test('retrieves a single object', async t => {
  let expected = { first: 'fee', second: 'blah' }
  let res = await db.findOne('first')
  t.deepEqual(res, expected)
})

test('allows retrieving a specific property', async t => {
  let res = await db.findOne('first.second')
  t.deepEqual(res, 'blah')
})
