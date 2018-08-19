import test from 'ava'
import { existsSync } from 'fs'
import { join, basename } from 'path'

import * as rimraf from 'rimraf'

import { create } from '../src'

const getPath = (name: any) =>
  join(__dirname, `${basename(`${__filename}-${name}`, '.ts')}.db`)

const [js, native] = [getPath('sqljs'), getPath('native')]

let dbJS: Trilogy
let dbNative: Trilogy

test.after.always('remove test database file', async () => {
  await Promise.all([dbJS.close(), dbNative.close()])
  rimraf.sync(js)
  rimraf.sync(native)
})

test('throws if no file path is provided', t => {
  // @ts-ignore
  t.throws(() => create(), Error)
})

test('native client creates a new file immediately', t => {
  t.false(existsSync(native))

  dbNative = create(native)
  t.true(existsSync(native))
})

test('sql.js client creates a new file immediately', t => {
  t.false(existsSync(js))

  dbJS = create(js, { client: 'sql.js' })
  t.true(existsSync(js))
})

test('in-memory database does not create a file', t => {
  const fakePath = join(process.cwd(), ':memory:')
  t.false(existsSync(fakePath))

  create(':memory:')
  t.false(existsSync(fakePath))
})
