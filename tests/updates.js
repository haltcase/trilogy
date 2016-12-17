import Trilogy from '../dist/trilogy'

import test from 'ava'
import { remove } from 'fs-jetpack'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

test.before(async () => {
  await db.createTable('one', ['first', 'second'])
  await db.insert('one', {
    first: 'fee',
    second: 'blah'
  })
})

test.after.always('remove test database file', () => remove(filePath))

test('changes the value of an existing key', async t => {
  await db.update('one', { second: 'blurg' }, { first: 'fee' })
  let res = await db.getValue('one.second', { first: 'fee' })
  t.is(res, 'blurg')
})
