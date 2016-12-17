import Trilogy from '../dist/trilogy'

import test from 'ava'
import { remove } from 'fs-jetpack'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

test.before(async () => {
  await db.createTable('first', ['first', 'second'])
  await db.insert('first', {
    first: 'fee',
    second: 'blah'
  })
})

test.after.always('remove test database file', () => remove(filePath))

test('retrieves a single row as an object', async t => {
  let expected = { first: 'fee', second: 'blah' }
  let res = await db.first('first')
  t.deepEqual(res, expected)
})
