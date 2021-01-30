import ava, { TestInterface } from "ava"
import { connect, ColumnType, ModelWithShape } from "../src"

import { FirstSecond } from "./helpers/types"

const test = ava as TestInterface<{
  one: ModelWithShape<FirstSecond>
}>

const db = connect(":memory:")

test.before(async t => {
  t.context.one = await db.modelWithShape("one", {
    first: ColumnType.String,
    second: ColumnType.String
  })

  await Promise.all([
    t.context.one.create({
      first: "fee",
      second: "blah"
    }),
    t.context.one.create({
      first: "shoot",
      second: "buckets"
    })
  ])
})

test.after.always(() => db.close())

test("get() - retrieves a specific property of the object", async t => {
  const res = await t.context.one.get("second", { first: "fee" })
  t.is(res, "blah")
})

test("get() - is undefined when no value at the path exists", async t => {
  const noRow = await t.context.one.get("second", { first: "worst" })
  t.is(noRow, undefined)

  // @ts-expect-error
  const noColumn = await t.context.one.get("third", { first: "fee" })
  t.is(noColumn, undefined)
})

test("get() - returns the provided default value when target is undefined", async t => {
  const noRow = await t.context.one.get("second", { first: "worst" }, "nothing")
  t.is(noRow, "nothing")
})

test("set() - updates the target value", async t => {
  const expected = "some super new value"
  await t.context.one.set("second", { first: "shoot" }, expected)

  const actual = await t.context.one.get("second", { first: "shoot" })
  t.is(actual, expected)
})

test("model.get() & model.set()", async t => {
  const people = await db.model("get_set_people", {
    name: ColumnType.String,
    age: ColumnType.Number
  })

  const persons = [
    { name: "Dale", age: 30 },
    { name: "Lelu", age: 6 },
    { name: "Gurlak", age: 302 }
  ]

  await Promise.all(persons.map(p => people.create(p)))

  const actual = await people.get("age", { name: "Dale" })
  t.is(actual, 30)

  await people.set("age", { name: "Dale" }, 32)
  t.is(await people.get("age", { name: "Dale" }), 32)
})
