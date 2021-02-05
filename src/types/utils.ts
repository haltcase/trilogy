export type LooseObject =
  Record<string, any>

export type Simplify <T> =
  T extends (object | any[])
    ? { [K in keyof T]: T[K] }
    : T

export type Nullable <T> =
  T | null | undefined

export type Listable <T> =
  T | T[]

export type Compulsory <T extends object> = {
  [K in keyof T]-?: NonNullable<T[K]>
}

export type DistinctArrayTuple <T, V = any> =
  T extends [string, string, V]
    ? [string, string, V]
    : T extends [string, V]
      ? [string, V]
      : T extends V[]
        ? V[]
        : V

export type Fn <T extends any[], R = any> =
  (...args: T) => R

export type IfUnknown <T, L = true, R = false> =
  unknown extends T ? L : R

export type Cast <T, TargetType> =
  T extends TargetType ? T : never

export type Extends <A, B, T = true, F = false> =
  [A] extends [B] ? [B] extends [A]
    ? T
    : F : F

export type StringKeys <T = Record<any, any>> =
  Extract<keyof T, string>

export type OptionalKeys <T> = Exclude<{
  [K in keyof T]: T extends Record<K, T[K]> ? never : K
}[keyof T], undefined>

export declare const type: unique symbol

type Narrowable =
  | string
  | number
  | bigint
  | boolean
  | []

export type Const <A, W = unknown> =
  | (A extends Narrowable ? A : never)
  | { [K in keyof A]: ConstAt<A, W, K> }

type ConstAt <A, W, K extends keyof A> =
  K extends keyof W
    ? W[K] extends Widen<infer T>
      ? T
      : Const<A[K], W[K]>
    : Const<A[K], {}>

export type Widen <A = unknown> = { [type]: A }
