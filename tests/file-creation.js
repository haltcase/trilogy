import Trilogy from '../dist/trilogy'

import test from 'ava'
import { join, basename } from 'path'
import { exists, remove } from 'fs-jetpack'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)

let db

test.after.always('remove test database file', () => {
  return db.close().then(() => remove(filePath))
})

test('throws if no file path is provided', t => {
  t.throws(() => new Trilogy(), Error)
})

test('successfully creates a new file', async t => {
  t.is(exists(filePath), false)

  db = new Trilogy(filePath)
  await db.model('test', { name: String })

  t.is(exists(filePath), 'file')
})
