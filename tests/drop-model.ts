import test from "ava"
import { connect, ColumnType } from "../src"

const db = connect(":memory:")

const schema = { name: ColumnType.String }

const tables = [
  { name: "one", schema },
  { name: "two", schema },
  { name: "three", schema }
]

test.before(async () => {
  await Promise.all(
    tables.map(async table => db.model(table.name, table.schema))
  )
})

test.after.always(async () => db.close())

test("removes tables from the database", async t => {
  const removals = await Promise.all(
    tables.map(async ({ name }) => {
      return db.dropModel(name).then(async () => db.hasModel(name))
    })
  )

  removals.forEach(v => t.false(v))
})
