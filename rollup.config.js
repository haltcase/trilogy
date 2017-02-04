import babel from 'rollup-plugin-babel'

const pkg = require('./package.json')
const external = Object.keys(pkg.dependencies).concat(['path', 'sql.js'])

export default {
  entry: 'src/index.js',
  external,
  plugins: [
    babel({
      babelrc: false,
      presets: [['env', {
        loose: true,
        modules: false,
        targets: { node: 4.7 }
      }], 'stage-0'],
      plugins: [
        'external-helpers',
        'add-module-exports'
      ],
      runtimeHelpers: false,
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
