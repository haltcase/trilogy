export enum ColumnTypes {
  increments = "increments",
  array = "array",
  object = "object",
  json = "json",
  string = "string",
  number = "number",
  boolean = "boolean",
  date = "date"
}

export enum KnexNoArgs {
  primary = "primary",
  unique = "unique",
  notNullable = "notNullable"
}

export enum IgnorableProps {
  name = "name",
  nullable = "nullable",
  type = "type",
  get = "get",
  set = "set"
}

export const enum Driver {
  native = "native",
  js = "js"
}
