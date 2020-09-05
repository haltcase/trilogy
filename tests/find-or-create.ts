import test from "ava"
import { connect } from "../src"

import { Game } from "./helpers/types"

const db = connect(":memory:")

test.after.always(() => db.close())

test("creates missing objects or returns an existing one", async t => {
  const games = await db.model<Game>("games", {
    name: { type: String, primary: true },
    last_played: Date,
    genre: String
  })

  t.is(await games.count({ genre: "FPS" }), 0)

  const first = {
    name: "Overwatch",
    last_played: new Date("Jan 31, 2017"),
    genre: "FPS"
  }

  const fresh = await games.findOrCreate(first)

  t.is(await games.count({ genre: "FPS" }), 1)

  const existing1 = await games.findOrCreate({ name: "Overwatch" })
  const existing2 = await games.findOrCreate(first)

  t.deepEqual(fresh, existing1)
  t.deepEqual(fresh, existing2)
  t.is(await games.count({ genre: "FPS" }), 1)

  t.is(fresh!.last_played.toISOString(), existing1!.last_played.toISOString())
  t.is(fresh!.last_played.toISOString(), existing2!.last_played.toISOString())
})
