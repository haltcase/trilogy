import Trilogy from '../dist/trilogy'

import test from 'ava'
import rimraf from 'rimraf'
import { existsSync } from 'fs'
import { join, basename } from 'path'

const getPath = name =>
  join(__dirname, `${basename(`${__filename}-${name}`, '.js')}.db`)

const [js, native] = [getPath('sqljs'), getPath('native')]

let dbJS
let dbNative

test.after.always('remove test database file', async () => {
  await Promise.all([dbJS.close(), dbNative.close()])
  rimraf.sync(js)
  rimraf.sync(native)
})

test('throws if no file path is provided', t => {
  t.throws(() => new Trilogy(), Error)
})

test('native client creates a new file immediately', t => {
  t.false(existsSync(native))

  dbNative = new Trilogy(native)
  t.true(existsSync(native))
})

test('sql.js client creates a new file immediately', t => {
  t.false(existsSync(js))

  dbJS = new Trilogy(js, { client: 'sql.js' })
  t.true(existsSync(js))
})

test('in-memory database does not create a file', t => {
  let fakePath = join(process.cwd(), ':memory:')
  t.false(existsSync(fakePath))

  // eslint-disable-next-line no-new
  new Trilogy(':memory:')
  t.false(existsSync(fakePath))
})
