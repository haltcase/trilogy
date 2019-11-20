import { dirname } from 'path'
import { readFileSync, writeFileSync } from 'fs'

import { createPool, Pool } from 'generic-pool'

import { Trilogy } from '.'
import { makeDirPath } from './util'

import { SqlJs } from 'sql.js/module'

export async function readDatabase (instance: Trilogy): Promise<SqlJs.Database> {
  const name = instance.options.connection.filename

  const init = await import('sql.js')
  const SQL = await init()

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

export function writeDatabase (instance: Trilogy, db: SqlJs.Database) {
  const name = instance.options.connection.filename
  if (name === ':memory:') return

  makeDirPath(dirname(name))
  writeFileSync(name, db.export(), { mode: parseInt('0777', 8) })
}

export function pureConnect (instance: Trilogy): Pool<SqlJs.Database> {
  return createPool({
    create () {
      return readDatabase(instance)
    },

    async destroy (client: SqlJs.Database): Promise<void> {
      client.close()
    }
  }, { min: 1, max: 1 })
}
