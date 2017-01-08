import Trilogy from '../dist/trilogy'

import test from 'ava'
import { remove } from 'fs-jetpack'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

test.before(async () => {
  await db.model('one', {
    first: String,
    second: String
  })

  await db.create('one', {
    first: 'fee',
    second: 'blah'
  })
})

test.after.always('remove test database file', () => {
  return db.close().then(() => remove(filePath))
})

test('changes the value of an existing key', async t => {
  await db.update('one', { first: 'fee' }, { second: 'blurg' })
  let res = await db.get('one.second', { first: 'fee' })
  t.is(res, 'blurg')
})
