import Trilogy from '../dist/trilogy'

import test from 'ava'
import rimraf from 'rimraf'
import { existsSync } from 'fs'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)

let db

test.after.always('remove test database file', () => {
  return db.close().then(() => rimraf.sync(filePath))
})

test('throws if no file path is provided', t => {
  t.throws(() => new Trilogy(), Error)
})

test('successfully creates a new file', async t => {
  t.false(existsSync(filePath))

  db = new Trilogy(filePath)
  await db.model('test', { name: String })

  t.true(existsSync(filePath))
})
