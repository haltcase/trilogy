import babel from 'rollup-plugin-babel'

const pkg = require('./package.json')
const external = Object.keys(pkg.dependencies)

export default {
  entry: 'lib/index.js',
  plugins: [
    babel({
      babelrc: false,
      presets: [
        ['es2015', { modules: false }],
        'stage-0'
      ],
      plugins: [
        'syntax-flow',
        'transform-flow-strip-types',
        'transform-runtime'
      ],
      externalHelpers: false,
      runtimeHelpers: true
    })
  ],
  external,
  targets: [{
    dest: pkg['main'],
    format: 'umd',
    moduleName: 'trilogy',
    sourceMap: true
  }, {
    dest: pkg['jsnext:main'],
    format: 'es',
    sourceMap: true
  }]
}
