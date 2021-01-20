import ava, { TestInterface } from "ava"
import { connect, ModelWithShape } from "../src"

import { Person } from "./helpers/types"

const test = ava as TestInterface<{
  people: ModelWithShape<Person>
}>

const db = connect(":memory:")

const persons = [
  { name: "Dale", age: 30 },
  { name: "Lelu", age: 6 },
  { name: "Gurlak", age: 302 }
]

test.before(async t => {
  t.context.people = await db.modelWithShape<Person>("people", {
    name: String,
    age: Number
  })

  t.context.people.create({
    name: "Bo",
    age: 29
  })

  await Promise.all(persons.map(async person => t.context.people.create(person)))
})

test.after.always(() => db.close())

test("returns the number of models when parameter count === 0", async t => {
  t.is(await t.context.people.count(), 1)
  await db.model("count_crayons", { color: String })
  t.is(await t.context.people.count(), 2)
})

test("returns the total number of rows", async t => {
  const res = await t.context.people.count()
  t.is(res, 3)
})

test("returns the number of matching rows", async t => {
  const res = await t.context.people.count(["age", "<", 200])
  t.is(res, 2)
})

test("allows for multiple where clauses", async t => {
  const res = await t.context.people.count([
    ["age", "<", 200],
    ["age", ">", 20]
  ])

  t.is(res, 1)
})

test("countIn() variant counts on the given column", async t => {
  const db = connect(":memory:")

  interface Person {
    name: string
    // allow null in order to test that null values
    // in the target column aren't counted
    age: number | null
  }

  const people = await db.modelWithShape<Person>("people", {
    name: { type: String, primary: true },
    age: Number
  })

  await Promise.all(persons.map(async person => people.create(person)))
  await people.create({ name: "", age: null })

  const res = await people.countIn("age")

  t.is(res, persons.length)
})
