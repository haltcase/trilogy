import babel from 'rollup-plugin-babel'

const pkg = require('./package.json')
const external = Object.keys(pkg.dependencies)
  .concat(['fs', 'path', 'sql.js'])

const base = cjs => ({
  input: 'src/index.js',
  external,
  plugins: [
    babel({
      babelrc: false,
      presets: [['env', {
        loose: true,
        modules: false,
        targets: { node: '4.7.0' }
      }], 'stage-0'],
      plugins: cjs
        ? ['external-helpers', 'add-module-exports']
        : ['external-helpers'],
      runtimeHelpers: false,
      exclude: 'node_modules/**'
    })
  ],
  output: [{
    file: cjs ? pkg.main : pkg.module,
    format: cjs ? 'cjs' : 'es'
  }]
})

export default [
  base(),
  base(true)
]
