import test from "ava"
import { connect } from "../src"

const db = connect(":memory:")

test.after.always(() => db.close())

test("retrieves rows as arrays of objects", async t => {
  const keepers = await db.model("keepers", {
    first: String,
    second: String
  })

  const items = ["fee", "fi", "fo", "fum"]

  await Promise.all(
    items.map(v => keepers.create({ first: v, second: "blah" }))
  )

  const results = await keepers.find()

  t.true(Array.isArray(results))
  results.forEach((obj, i) => t.is(obj.first, items[i]))
})

test("allows for multiple where clauses", async t => {
  const people = await db.model("find_people", {
    age: Number,
    gender: String
  })

  const list = [
    { age: 31, gender: "male" },
    { age: 41, gender: "male" },
    { age: 51, gender: "female" },
    { age: 49, gender: "female" }
  ]

  await Promise.all(list.map(p => people.create(p)))

  const found = await people.find([
    ["age", ">", 50],
    { gender: "female" }
  ])

  t.is(found.length, 1)
  t.deepEqual(found, [{ age: 51, gender: "female" }])
})

test("2 element tuple works within multiple where clauses", async t => {
  const people = await db.model("find_people2", {
    age: Number,
    gender: String
  })

  const list = [
    { age: 20, gender: "male" },
    { age: 20, gender: "female" }
  ]

  await Promise.all(list.map(p => people.create(p)))

  const results = await people.find([
    ["age", 20],
    { gender: "male" }
  ])

  t.deepEqual(results, [
    { age: 20, gender: "male" }
  ])
})

test("findIn() variant extracts the given column from all found objects", async t => {
  const people = await db.model("find_people3", {
    age: Number,
    gender: String
  })

  const list = [
    { age: 20, gender: "male" },
    { age: 20, gender: "female" }
  ]

  await Promise.all(list.map(p => people.create(p)))

  const results = await people.findIn("gender")
  t.deepEqual(results, ["male", "female"])
})
