import Trilogy from '../dist/trilogy'

import test from 'ava'
import { join, basename } from 'path'
import { exists, remove } from 'fs-jetpack'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)

test.after.always('remove test database file', () => remove(filePath))

test('throws if no file path is provided', t => {
  t.throws(() => new Trilogy(), Error)
})

test('successfully creates a new file', t => {
  let db = new Trilogy(filePath)
  t.is(exists(filePath), 'file')
  t.is(db.path, filePath)
})
