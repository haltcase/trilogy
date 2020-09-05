const [, , error] = [0, 1, 2]

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
    }],
    "no-void": [error, {
      allowAsStatement: true
    }],
    "@typescript-eslint/consistent-type-assertions": [error, {
      assertionStyle: "as",
      objectLiteralTypeAssertions: "allow-as-parameter"
    }],
    "@typescript-eslint/explicit-function-return-type": [error, {
      allowTypedFunctionExpressions: true
    }],
    "@typescript-eslint/quotes": [error, "double", {
      avoidEscape: true,
      allowTemplateLiterals: true
    }],
    "@typescript-eslint/return-await": [error, "in-try-catch"],
    "@typescript-eslint/strict-boolean-expressions": [error, {
      allowNullableBoolean: true
    }]
  }
}
