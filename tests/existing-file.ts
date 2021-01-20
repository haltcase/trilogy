import ava, { TestInterface } from "ava"
import { join, basename } from "path"

import { connect, ModelWithShape } from "../src"

type Data = {
  item: string,
  price: string
}

const test = ava as TestInterface<{ data: ModelWithShape<Data> }>

const filePath = join(__dirname, `${basename(__filename, ".ts")}.db`)
const db = connect(filePath)

test.before("insert default data", async t => {
  t.context.data = await db.modelWithShape("data", {
    item: String,
    price: String
  })

  await t.context.data.create({ item: "freedom", price: "not free" })
})

test("successfully reads in an existing file", async t => {
  const res = await t.context.data.get("price", { item: "freedom" })
  t.is(res, "not free")
})
