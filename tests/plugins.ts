import test from 'ava'
import { Plugin, PluginBase, mix } from '../src'

interface Greeter1 {
  greet: () => string
}

const plugin1: Plugin<Greeter1> = (TB: PluginBase) => {
  return class extends TB {
    greet () {
      return 'hello'
    }
  }
}

interface Greeter2 {
  greet: () => string,
  goodbye: () => string
}

const plugin2: Plugin<Greeter2> = (TB: PluginBase) => {
  return class extends TB {
    greet () {
      return 'hi there'
    }

    goodbye () {
      return 'farewell'
    }
  }
}

test('single plugin works correctly', async t => {
  const db = new (mix([plugin1]))(':memory:')
  t.is(db.greet(), 'hello')
})

test('multiple plugins works correctly', async t => {
  const db = new (mix([plugin1, plugin2]))(':memory:')
  t.is(db.greet(), 'hi there')
  t.is(db.goodbye(), 'farewell')
})
