import ava, { TestInterface } from "ava"
import { connect, Model } from "../src"

import { Person } from "./helpers/types"

const test = ava as TestInterface<{ people: Model<Person> }>

const db = connect(":memory:")

const persons = [
  { name: "Dale", age: 30 },
  { name: "Lelu", age: 6 },
  { name: "Gurlak", age: 302 }
]

test.before(async t => {
  t.context.people = await db.model("people", {
    name: String,
    age: Number
  })

  await Promise.all(persons.map(person => t.context.people.create(person)))
})

test.after.always(() => db.close())

test.serial("decrements by 1 when no amount is provided", async t => {
  const values = await Promise.all(
    persons.map(({ name, age }, i) => {
      persons[i].age -= 1
      return t.context.people.decrement("age", { name })
        .then(() => t.context.people.get("age", { name }))
        .then(val => [age, val])
    })
  )

  values.forEach(([age, val]) => t.is(val, age - 1))
})

test.serial("decrements by a specified amount", async t => {
  const values = await Promise.all(
    persons.map(({ name, age }, i) => {
      persons[i].age -= 4
      return t.context.people.decrement("age", { name }, 4)
        .then(() => t.context.people.get("age", { name }))
        .then(val => [age, val])
    })
  )

  values.forEach(([age, val]) => t.is(val, age - 4))
})

test.serial("does not allow negative values when allowNegative is falsy", async t => {
  await t.context.people.create({ name: "Benjamin Button", age: 100 })
  await t.context.people.decrement("age", { name: "Benjamin Button" }, 200)
  const res = await t.context.people.get("age", { name: "Benjamin Button" })
  t.is(res, 0)
})

test.serial("allows negative values when allowNegative is truthy", async t => {
  await t.context.people.decrement("age", { name: "Lelu" }, 2, true)
  const res = await t.context.people.get("age", { name: "Lelu" })
  t.is(res, -1)
})

test.serial("does nothing when passed a zero value", async t => {
  await t.context.people.decrement("age", { name: "Lelu" }, 0, true)
  const res = await t.context.people.get("age", { name: "Lelu" })
  t.is(res, -1)
})

test("allows for multiple where clauses", async t => {
  const people = await db.model<Person>("decrement_people", {
    age: Number,
    name: String
  })

  const list = [
    { age: 31, name: "Joe" },
    { age: 41, name: "Bob" },
    { age: 51, name: "Jill" },
    { age: 49, name: "Jane" }
  ]

  await Promise.all(list.map(p => people.create(p)))

  await people.decrement("age", [
    ["age", ">", 45],
    { name: "Jill" }
  ])

  const results = await Promise.all(
    list.map(({ name }) => people.get("age", { name }))
  )

  t.deepEqual(results, [31, 41, 50, 49])
})
