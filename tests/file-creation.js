import Trilogy from '../dist/trilogy'

import test from 'ava'
import { basename } from 'path'
import { exists, remove } from 'fs-jetpack'

const filePath = `${basename(__filename, '.js')}.db`

test.after.always('remove test database file', () => remove(filePath))

test('throws if no file path is provided', t => {
  t.throws(() => new Trilogy(), Error)
})

test('successfully creates a new file', t => {
  const db = new Trilogy(filePath)
  t.is(exists(filePath), 'file')
  t.is(db.fileName, filePath)
})
