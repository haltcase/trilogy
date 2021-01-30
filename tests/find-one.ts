import ava, { TestInterface } from "ava"
import { connect, ColumnType, ModelWithShape } from "../src"

import { FirstSecond } from "./helpers/types"

const test = ava as TestInterface<{
  first: ModelWithShape<FirstSecond>
}>

const db = connect(":memory:")

test.before(async t => {
  t.context.first = await db.modelWithShape("first", {
    first: ColumnType.String,
    second: ColumnType.String
  })

  await t.context.first.create({
    first: "fee",
    second: "blah"
  })
})

test.after.always(() => db.close())

test("retrieves a single object", async t => {
  const expected = { first: "fee", second: "blah" }
  const res = await t.context.first.findOne()
  t.deepEqual(res, expected)
})

test("allows retrieving a specific property", async t => {
  const res = await t.context.first.findOneIn("second")
  t.deepEqual(res, "blah")
})

test("allows for multiple where clauses", async t => {
  const people = await db.model("findOne_people", {
    age: ColumnType.Number,
    gender: ColumnType.String
  })

  const list = [
    { age: 31, gender: "male" },
    { age: 41, gender: "male" },
    { age: 51, gender: "female" },
    { age: 49, gender: "female" }
  ]

  await Promise.all(list.map(p => people.create(p)))

  const found = await people.findOne([
    ["age", ">", 50],
    { gender: "female" }
  ])

  t.deepEqual(found, { age: 51, gender: "female" })
})

test("findOneIn() variant extracts & returns the specified column", async t => {
  const people = await db.model("findOne_people2", {
    age: ColumnType.Number,
    gender: ColumnType.String
  })

  const list = [
    { age: 31, gender: "male" },
    { age: 41, gender: "male" },
    { age: 51, gender: "female" },
    { age: 49, gender: "female" }
  ]

  await Promise.all(list.map(p => people.create(p)))

  const found = await people.findOneIn("age", [
    ["age", ">", 50],
    { gender: "female" }
  ])

  t.is(found, 51)
})
