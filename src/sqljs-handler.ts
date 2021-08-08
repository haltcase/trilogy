import { dirname } from 'path'
import { readFileSync, writeFileSync } from 'fs'

import { createPool, Pool } from 'generic-pool'

import { Trilogy } from '.'
import { makeDirPath } from './util'

import { Database } from 'sql.js'

export async function readDatabase (instance: Trilogy): Promise<Database> {
  const name = instance.options.connection.filename

  const init = await import('sql.js')
  const SQL = await init.default()

  if (name === ':memory:') {
    return new SQL.Database()
  }

  let client

  try {
    makeDirPath(dirname(name))
    const file = readFileSync(name)
    client = new SQL.Database(file)
  } catch (e) {
    if (e.code === 'ENOENT') {
      client = new SQL.Database()
      writeDatabase(instance, client)
    } else {
      throw e
    }
  }

  return client
}

export function writeDatabase (instance: Trilogy, db: Database) {
  const name = instance.options.connection.filename
  if (name === ':memory:') return

  makeDirPath(dirname(name))
  writeFileSync(name, db.export(), { mode: parseInt('0777', 8) })
}

export function pureConnect (instance: Trilogy): Pool<Database> {
  return createPool({
    create () {
      return readDatabase(instance)
    },

    async destroy (client: Database): Promise<void> {
      client.close()
    }
  }, { min: 1, max: 1 })
}
