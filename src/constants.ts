export enum KnexNoArgs {
  primary = "primary",
  unique = "unique",
  notNullable = "notNullable"
}

export enum KnexMethod {
  text = "text",
  integer = "integer",
  dateTime = "dateTime",
  increments = "increments"
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

export enum TriggerEvent {
  Insert = "insert",
  Update = "update",
  Delete = "delete"
}
