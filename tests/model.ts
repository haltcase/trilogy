import test from "ava"
import { connect } from "../src"
import * as ColumnType from "../src/column-types"

import { SqliteMaster } from "./helpers/types"

const db = connect(":memory:")

test.after.always(() => db.close())

test("creates a new model definition", async t => {
  await db.model("teams", {
    name: String,
    playoffs: { type: Boolean, defaultTo: false }
  })

  t.true(await db.hasModel("teams"))
})

test("defines a model with a uniquely constrained property", async t => {
  const sodas = await db.model("sodas", {
    name: { type: String, unique: true },
    flavor: String
  })

  const object = { name: "coke", flavor: "awesome" }
  await sodas.create(object)
  await sodas.create(object)

  t.is(await sodas.count({ name: "coke" }), 1)
})

test("defines a model with a single named index", async t => {
  await db.model("sodas2", {
    name: { type: String, index: "idx_name" },
    flavor: String
  })

  const query = db.knex.raw('SELECT * FROM sqlite_master WHERE type = "index"')
  const results = await db.getRawResult<SqliteMaster[]>(query)
  const def = results.filter(item => item.tbl_name === "sodas2")
  t.is(def[0].sql, "CREATE INDEX `idx_name` on `sodas2` (`name`)")
})

test("defines a model with multiple indices", async t => {
  const schema = {
    name: String,
    flavor: String
  }

  await db.model("sodas_single", schema, {
    index: "name"
  })

  await db.model("sodas_array", schema, {
    index: [
      ["name", "flavor"],
      ["flavor", "name"]
    ]
  })

  await db.model("sodas_object", schema, {
    index: {
      idx_name_flvr: ["name", "flavor"],
      idx_flvr_name: ["flavor", "name"]
    }
  })

  const query = db.knex.raw('SELECT * FROM sqlite_master WHERE type = "index"')
  const results = await db.getRawResult<SqliteMaster[]>(query)

  const single = results.find(item => item.tbl_name === "sodas_single")
  t.is(single?.sql, "CREATE INDEX `sodas_single_name_index` on `sodas_single` (`name`)")

  const array = results.filter(item => item.tbl_name === "sodas_array")

  t.true(array.length > 2)

  t.is(
    array[0].sql,
    "CREATE INDEX `sodas_array_name_flavor_index` on `sodas_array` (`name`, `flavor`)"
  )
  t.is(
    array[1].sql,
    "CREATE INDEX `sodas_array_flavor_name_index` on `sodas_array` (`flavor`, `name`)"
  )

  const object = results.filter(item => item.tbl_name === "sodas_object")
  t.true(object.length > 2)
  t.is(object[0].sql, "CREATE INDEX `idx_name_flvr` on `sodas_object` (`name`, `flavor`)")
  t.is(object[1].sql, "CREATE INDEX `idx_flvr_name` on `sodas_object` (`flavor`, `name`)")
})

test("accepts column types as built-in JS type constructors", async t => {
  type Builtins = {
    name: string,
    name2: string,
    age: number,
    age2: number,
    birthdate: Date,
    birthdate2: Date,
    adult: boolean,
    adult2: boolean,
    friends: string[],
    friends2: string[],
    other: Record<string, number>,
    loose: object,
  }

  const builtins = await db.modelWithShape<Builtins>("types_builtin", {
    name: String,
    name2: { type: String },

    age: Number,
    age2: { type: Number },

    birthdate: Date,
    birthdate2: { type: Date },

    adult: Boolean,
    adult2: { type: Boolean },

    friends: Array,
    friends2: { type: Array },

    other: Object,
    loose: { type: Object }
  })

  await builtins.create({
    name: "Bob",
    name2: "Bobby",
    age: 20,
    age2: 20,
    birthdate: new Date(),
    birthdate2: new Date(),
    adult: true,
    adult2: true,
    friends: ["Jim"],
    friends2: ["Jim"],
    other: { number: 4 },
    loose: { anything: { allowed: "here" } }
  })
})

test("accepts column types as known constant strings", async t => {
  type Constants = {
    name: ColumnType.String,
    name2: ColumnType.String,
    age: ColumnType.Number,
    age2: ColumnType.Number,
    birthdate: ColumnType.Date,
    birthdate2: ColumnType.Date,
    adult: ColumnType.Boolean,
    adult2: ColumnType.Boolean,
    friends: ColumnType.Array,
    friends2: string[],
    other: Record<string, number>,
    loose: ColumnType.Object,
    json: ColumnType.Json
  }

  await db.modelWithShape<Constants>("types_constants", {
    name: ColumnType.String,
    name2: { type: ColumnType.String },

    age: ColumnType.Number,
    age2: { type: ColumnType.Number },

    birthdate: ColumnType.Date,
    birthdate2: { type: ColumnType.Date },

    adult: ColumnType.Boolean,
    adult2: { type: ColumnType.Boolean },

    friends: ColumnType.Array,
    friends2: { type: ColumnType.Array },

    other: ColumnType.Object,

    json: ColumnType.Json,
    json2: { type: ColumnType.Json },

    id: ColumnType.Increments
  })
})
