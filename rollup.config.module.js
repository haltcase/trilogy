import babel from 'rollup-plugin-babel'

const pkg = require('./package.json')
const external = Object.keys(pkg.dependencies)
  .concat(['fs', 'path', 'sql.js'])

export default {
  entry: 'src/index.js',
  external,
  plugins: [
    babel({
      babelrc: false,
      presets: [['env', {
        loose: true,
        modules: false,
        targets: { node: '4.7.0' }
      }], 'stage-0'],
      plugins: [
        'external-helpers'
      ],
      runtimeHelpers: false,
      exclude: 'node_modules/**'
    })
  ],
  targets: [{
    dest: pkg.module,
    format: 'es'
  }]
}
