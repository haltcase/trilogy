import ava, { TestInterface } from "ava"
import { connect, ColumnType, ModelWithShape } from "../src"
import { Person } from "./helpers/types"

const test = ava as TestInterface<{
  people: ModelWithShape<Person>
}>

const db = connect(":memory:")

test.before(async t => {
  t.context.people = await db.modelWithShape<Person>("people", {
    name: {
      type: ColumnType.String,
      get: name => name.toUpperCase()
    },
    age: {
      type: ColumnType.Number,
      set: age => age + 1
    }
  })

  await t.context.people.create({
    name: "Joey Smith",
    age: 20
  })
})

test.after.always(async () => db.close())

test("getter only alters the returned value, not the stored value", async t => {
  const [upper, lower] = await Promise.all([
    t.context.people.findOne({ name: "JOEY SMITH" }),
    t.context.people.findOne({ name: "Joey Smith" })
  ])

  t.is(typeof upper, "undefined")
  t.deepEqual(lower, { name: "JOEY SMITH", age: 21 })
})

test("setter alters the stored value after each update", async t => {
  // setters fire on object creation
  const initial = await t.context.people.get("age", { name: "Joey Smith" })
  t.is(initial, 21)

  await t.context.people.update({ name: "Joey Smith" }, { age: 25 })
  t.is(await t.context.people.get("age", { name: "Joey Smith" }), 26)
  await t.context.people.set("age", { name: "Joey Smith" }, 27)
  t.is(await t.context.people.get("age", { name: "Joey Smith" }), 28)
})

test("getters & setters are not fired by `getRaw()` or `setRaw()`", async t => {
  await t.context.people.create({
    name: "John Doe",
    age: 44
  }, { raw: true })

  const initial = await t.context.people.getRaw("name", { age: 44 })
  t.is(initial, "John Doe")

  const affected = await t.context.people.findOne({ age: 44 })
  t.is(affected?.name, "JOHN DOE")
  t.is(affected?.age, 44)

  await t.context.people.setRaw("age", { name: "John Doe" }, 50)
  const updated = await t.context.people.getRaw("age", { name: "John Doe" })
  t.is(updated, 50)

  await t.context.people.update({ name: "John Doe" }, { age: 55 })
  const final = await t.context.people.getRaw("age", { name: "John Doe" })
  t.is(final, 56)
})

test("setters are not fired when `options.raw` is set", async t => {
  const options = { raw: true }

  await t.context.people.create({
    name: "Libby Wilson",
    age: 16
  }, options)

  const first = await t.context.people.get("age", { name: "Libby Wilson" })
  t.is(first, 16)

  await t.context.people.update({ name: "Libby Wilson" }, { age: 17 }, options)
  const second = await t.context.people.get("age", { name: "Libby Wilson" })
  t.is(second, 17)
})

test("getters are not fired when `options.raw` is set", async t => {
  const options = { raw: true }

  await t.context.people.create({
    name: "A-A-ron",
    age: 99
  }, options)

  const [fired, bypassed] = await Promise.all([
    t.context.people.findOne({ age: 99 }),
    t.context.people.findOne({ age: 99 }, options)
  ])

  t.is(fired?.name, "A-A-RON")
  t.is(bypassed?.name, "A-A-ron")
})
