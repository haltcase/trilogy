import test from "ava"
import { connect } from "../src"

const db = connect(":memory:")

const schema = { name: String }

const tables = [
  { name: "one", schema },
  { name: "two", schema },
  { name: "three", schema }
]

test.before(async () => {
  await Promise.all(tables.map(table => {
    return db.model(table.name, table.schema)
  }))
})

test.after.always(() => db.close())

test("is true for existing tables", async t => {
  await Promise.all(
    tables.map(async ({ name }) => t.true(await db.hasModel(name)))
  )
})

test("is false for non-existent tables", async t => {
  const noTables = ["four", "five", "six"]
  await Promise.all(
    noTables.map(async table => t.false(await db.hasModel(table)))
  )
})
