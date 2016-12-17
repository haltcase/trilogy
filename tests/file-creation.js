import Trilogy from '../dist/trilogy'

import test from 'ava'
import { join, basename, dirname } from 'path'
import { exists, remove } from 'fs-jetpack'

const directory = dirname(__filename)
const fileName = `${basename(__filename, '.js')}.db`
const filePath = join(directory, fileName)

test.after.always('remove test database file', () => remove(filePath))

test('throws if no file path is provided', t => {
  t.throws(() => new Trilogy(), Error)
})

test('successfully creates a new file', t => {
  const db = new Trilogy(filePath)
  t.is(exists(filePath), 'file')
  t.is(db.path, filePath)
})
