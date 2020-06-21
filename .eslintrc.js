const [,, error] = [0, 1, 2]

module.exports = {
  root: true,
  extends: [
    "standard-with-typescript"
  ],
  parserOptions: {
    project: "./tsconfig.json"
  },
  rules: {
    quotes: [error, "double", {
      avoidEscape: true,
      allowTemplateLiterals: true
    }]
  }
}
