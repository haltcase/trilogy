import ava, { TestInterface } from "ava"
import { connect, ColumnType, ModelWithShape } from "../src"

import { Person, Person3 } from "./helpers/types"

const test = ava as TestInterface<{
  people: ModelWithShape<Person>,
  others: ModelWithShape<Person>
}>

const db = connect(":memory:")

const somePeople = [
  { name: "Dale", age: 30 },
  { name: "Lelu", age: 6 },
  { name: "Gurlak", age: 302 }
]

const morePeople = [
  { name: "Lara", age: 20 },
  { name: "Spyro", age: 18 },
  { name: "Benjamin Button", age: 100 }
]

test.before(async t => {
  const [people, others] = await Promise.all([
    db.modelWithShape<Person>("people", {
      name: { type: ColumnType.String, primary: true },
      age: ColumnType.Number
    }),

    db.modelWithShape<Person>("others", {
      name: { type: ColumnType.String, primary: true },
      age: ColumnType.Number
    })
  ])

  t.context.people = people
  t.context.others = others

  await Promise.all([
    ...somePeople.map(person => people.create(person)),
    ...morePeople.map(person => others.create(person))
  ])
})

test.after.always(() => db.close())

test.serial("removes an object from the specified model", async t => {
  await Promise.all(somePeople.map(async ({ name }) => {
    await t.context.others.remove({ name })
    const res = await t.context.others.findOne({ name })
    t.falsy(res)
  }))
})

test.serial("removes all objects from the specified model", async t => {
  await t.context.people.clear()

  const quantity = await t.context.people.count()
  t.falsy(quantity)

  const values = await Promise.all(
    morePeople.map(({ name }) => t.context.people.findOne({ name }))
  )

  values.forEach(value => t.falsy(value))
})

test("allows for multiple where clauses", async t => {
  const people = await db.modelWithShape<Person3>("deletions_people", {
    age: ColumnType.Number,
    favoriteColor: ColumnType.String
  })

  const list = [
    { age: 20, favoriteColor: "blue" },
    { age: 25, favoriteColor: "red" },
    { age: 30, favoriteColor: "red" },
    { age: 40, favoriteColor: "gray" }
  ]

  await Promise.all(list.map(p => people.create(p)))

  const removed = await people.remove([
    ["age", "<", 45],
    { favoriteColor: "red" }
  ])

  t.is(removed.length, 2)

  const remaining = await people.find()

  t.is(remaining.length, 2)
  t.deepEqual(remaining, [
    { age: 20, favoriteColor: "blue" },
    { age: 40, favoriteColor: "gray" }
  ])
})
