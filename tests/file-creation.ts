import test from "ava"
import { existsSync } from "fs"
import { join, basename } from "path"

import * as rimraf from "rimraf"

import { connect, Trilogy } from "../src"

const getPath = (name: string): string =>
  join(__dirname, `${basename(`${__filename}-${name}`, ".ts")}.db`)

const [js, native] = [getPath("sqljs"), getPath("native")]

let dbJS: Trilogy
let dbNative: Trilogy

test.after.always("remove test database file", async () => {
  await Promise.all([dbJS.close(), dbNative.close()])
  rimraf.sync(js)
  rimraf.sync(native)
})

test("throws if no file path is provided", t => {
  // @ts-expect-error
  t.throws(() => connect(), {
    message: "trilogy constructor must be provided a file path"
  })
})

test("native client creates a new file immediately", t => {
  t.false(existsSync(native))

  dbNative = connect(native)
  t.true(existsSync(native))
})

test("sql.js client creates a new file immediately", t => {
  t.false(existsSync(js))

  dbJS = connect(js, { client: "sql.js" })
  t.true(existsSync(js))
})

test("in-memory database does not create a file", t => {
  const fakePath = join(process.cwd(), ":memory:")
  t.false(existsSync(fakePath))

  connect(":memory:")
  t.false(existsSync(fakePath))
})
