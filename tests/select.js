import Trilogy from '../dist/trilogy'

import test from 'ava'
import { basename } from 'path'
import { remove } from 'fs-jetpack'

const filePath = `${basename(__filename, '.js')}.db`
const db = new Trilogy(filePath)

const arr = ['fee', 'fi', 'fo', 'fum']

test.before(async () => {
  await db.createTable('select', ['first', 'second'])
  arr.forEach(async v => await db.insert('select', {
    first: v,
    second: 'blah'
  }))
})

test.after.always('remove test database file', () => remove(filePath))

test('retrieves rows as arrays of objects', async t => {
  let res = await db.select('select')

  t.true(Array.isArray(res))
  res.forEach((obj, i) => t.is(obj.first, arr[i]))
})
