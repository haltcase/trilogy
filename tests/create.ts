import test from "ava"
import { connect, ColumnType } from "../src"

import { FirstSecond2 } from "./helpers/types"

const db = connect(":memory:")

const schema = {
  first: ColumnType.String,
  second: ColumnType.Number
}

const tables = [
  { name: "one", schema },
  { name: "two", schema },
  { name: "three", schema }
]

test.before(async () => {
  const promises = tables.map(async table => {
    return db.model(table.name, table.schema)
  })

  await Promise.all(promises)
})

test.after.always(async () => db.close())

test("create: inserts objects into the database", async t => {
  const inserts = [
    { table: "one", object: { first: "hello", second: 1 } },
    { table: "two", object: { first: "hello", second: 2 } },
    { table: "three", object: { first: "hello", second: 3 } }
  ]

  await Promise.all(
    inserts.map(async ({ table, object }) => db.getModelWithShape<FirstSecond2>(table).create(object))
  )

  const selects = await Promise.all(
    inserts.map(async ({ table, object }) => db.getModelWithShape<FirstSecond2>(table).find(object))
  )

  inserts.forEach(({ object }, i) => {
    t.deepEqual(selects[i], [object])
  })
})

test("create: handles nil values correctly", async t => {
  const [one, two] = await Promise.all([
    db.model("people_one", {
      name: { type: ColumnType.String }
    }),
    db.model("people_two", {
      name: { type: ColumnType.String, notNullable: true }
    })
  ])

  // @ts-expect-error
  await one.create({ name: null })
  // @ts-expect-error
  t.deepEqual(await one.findOne(), { name: null })

  await t.throwsAsync(
    // @ts-expect-error
    two.create({ name: null }),
    { message: "people_two.name is not nullable but received nil" }
  )

  await t.throwsAsync(
    // @ts-expect-error
    two.create({ name: undefined }),
    { message: "people_two.name is not nullable but received nil" }
  )
})

test("create: `increments` columns are inferred to be optional", async t => {
  type Things1 = {
    name: string
    id: "increments"
  }

  type Things2 = {
    name: string
    id: ColumnType.Increments
  }

  const things1 = await db.modelWithShape<Things1>("things1", {
    name: ColumnType.String,
    id: "increments"
  })

  const things2 = await db.modelWithShape<Things2>("things1", {
    name: ColumnType.String,
    id: ColumnType.Increments
  })

  await t.notThrowsAsync(async () => {
    await things1.create({ name: "one" })
    await things2.create({ name: "one" })
  })
})
