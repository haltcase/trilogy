const OFF = 0
const WARN = 1
const ERROR = 2

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    node: true
  },
  extends: 'standard',
  plugins: [
    'prefer-let'
  ],
  rules: {
    quotes: [ERROR, 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    'generator-star-spacing': [ERROR, { before: true, after: true }],
    'array-bracket-spacing': [ERROR, 'never'],
    'object-shorthand': [ERROR, 'always'],
    'arrow-parens': [ERROR, 'as-needed'],
    'comma-dangle': ERROR,
    'no-debugger': process.env.NODE_ENV === 'production' ? ERROR : OFF,
    'object-curly-spacing': [ERROR, 'always'],
    'no-await-in-loop': WARN,

    'prefer-let/prefer-let': WARN
  },
  settings: {}
}
