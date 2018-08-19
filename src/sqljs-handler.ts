import { dirname } from 'path'
import { readFileSync, writeFileSync } from 'fs'

import { createPool, Pool } from 'generic-pool'
import { Database } from 'sql.js'

import { Trilogy } from '.'
import { makeDirPath } from './util'

export function readDatabase (instance: Trilogy): Database {
  const SQL = require('sql.js')
  const name = instance.options.connection!.filename as string

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
  const name = instance.options.connection!.filename as string
  if (name === ':memory:') return

  makeDirPath(dirname(name))
  writeFileSync(name, db.export(), { mode: parseInt('0777', 8) })
}

export function pureConnect (instance: Trilogy): Pool<Database> {
  return createPool({
    create () {
      return Promise.resolve(readDatabase(instance))
    },

    destroy (client: Database): Promise<undefined> {
      client.close()
      return Promise.resolve(undefined)
    }
  }, { min: 1, max: 1 })
}
