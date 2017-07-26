import pool from 'generic-pool'
import { dirname } from 'path'
import { readFileSync, writeFileSync } from 'fs'

import { makeDirPath } from './util'

export function readDatabase (instance) {
  const SQL = require('sql.js')
  const { filename } = instance.options.connection

  if (filename === ':memory:') {
    return new SQL.Database()
  }

  let client

  try {
    makeDirPath(dirname(filename))
    const file = readFileSync(filename)
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

export function writeDatabase (instance, db) {
  const { filename } = instance.options.connection
  if (filename === ':memory:') return

  const data = db.export()
  const buffer = Buffer.from(data)

  makeDirPath(dirname(filename))
  writeFileSync(filename, buffer, { mode: parseInt('0777', 8) })
}

export function connect (instance) {
  return pool.createPool({
    create () {
      return Promise.resolve(readDatabase(instance))
    },

    destroy (client) {
      client.close()
      return Promise.resolve()
    }
  }, { min: 1, max: 1 })
}
