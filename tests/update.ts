import ava, { TestInterface } from "ava"
import { connect, ColumnType, ModelWithShape } from "../src"

import { Person2 } from "./helpers/types"

type One = {
  first?: string
  second?: string
  third?: boolean
  array?: any[]
}

const test = ava as TestInterface<{
  one: ModelWithShape<One>
}>

const db = connect(":memory:")

test.before(async t => {
  t.context.one = await db.modelWithShape<One>("one", {
    first: {
      type: ColumnType.String,
      nullable: true
    },
    second: {
      type: ColumnType.String,
      nullable: true
    },
    third: {
      type: ColumnType.Boolean,
      nullable: true
    },
    array: {
      type: ColumnType.Array,
      nullable: true
    }
  })

  await Promise.all([
    t.context.one.create({
      first: "fee",
      second: "blah"
    }),
    t.context.one.create({
      third: false,
      array: [1, 2, 3]
    })
  ])
})

test.after.always(async () => db.close())

test("changes the value of an existing key", async t => {
  await t.context.one.update({ first: "fee" }, { second: "blurg" })
  const res = await t.context.one.get("second", { first: "fee" })
  t.is(res, "blurg")
})

test("handles model type definitons correctly", async t => {
  await t.context.one.update({ third: false }, { array: [4, 5, 6] })
  const res = await t.context.one.get("array", { third: false })
  t.deepEqual(res, [4, 5, 6])
})

test("allows for using multiple where clauses", async t => {
  const people = await db.modelWithShape<Person2>("update_people", {
    age: ColumnType.Number,
    gender: ColumnType.String
  })

  const list = [
    { age: 31, gender: "male" },
    { age: 51, gender: "male" },
    { age: 51, gender: "female" },
    { age: 49, gender: "female" }
  ]

  await Promise.all(list.map(async p => people.create(p)))

  const affected = await people.update([
    ["age", ">", 45],
    { gender: "female" }
  ], { gender: "male" })

  const results = await people.find([
    ["age", ">", 45],
    { gender: "male" }
  ])

  t.is(affected.length, 2)
  t.is(results.length, 3)
  t.deepEqual(results, [
    { age: 51, gender: "male" },
    { age: 51, gender: "male" },
    { age: 49, gender: "male" }
  ])
})
