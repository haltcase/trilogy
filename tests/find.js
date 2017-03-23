import Trilogy from '../dist/trilogy'

import test from 'ava'
import rimraf from 'rimraf'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

const arr = ['fee', 'fi', 'fo', 'fum']

test.before(async () => {
  await db.model('select', {
    first: String,
    second: String
  })

  await Promise.all(
    arr.map(v => db.create('select', { first: v, second: 'blah' }))
  )
})

test.after.always('remove test database file', () => {
  return db.close().then(() => rimraf.sync(filePath))
})

test('retrieves rows as arrays of objects', async t => {
  let res = await db.find('select')

  t.true(Array.isArray(res))
  res.forEach((obj, i) => t.is(obj.first, arr[i]))
})
