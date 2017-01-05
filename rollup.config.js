import babel from 'rollup-plugin-babel'

const pkg = require('./package.json')
const external = Object.keys(pkg.dependencies)

export default {
  entry: 'src/index.js',
  external,
  plugins: [
    babel({
      babelrc: false,
      presets: [['env', {
        targets: { node: 4 },
        modules: false
      }], 'stage-0'],
      plugins: ['add-module-exports'],
      runtimeHelpers: true,
      exclude: 'node_modules/**'
    })
  ],
  targets: [{
    dest: pkg.main,
    format: 'cjs'
  }, {
    dest: pkg.module,
    format: 'es'
  }]
}
