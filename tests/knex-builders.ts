import test from "ava"
import { connect } from "../src"

const db = connect(":memory:")

test.after.always(async () => db.close())

test(".knex exposes the knex query builder", t => {
  t.is(typeof db.knex.select, "function")

  const expected = "select `foo` where `age` > 21 and `name` = 'Jerry'"
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  const res = db.knex
    .select("foo")
    .where("age", ">", 21)
    .andWhere({ name: "Jerry" })
    .toString()

  t.is(res, expected)
})
