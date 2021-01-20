import { invariant } from "./util"
import { normalizeCriteria } from "./helpers"

import {
  Fn,
  Criteria,
  CriteriaNormalized,
  CreateOptions,
  UpdateOptions,
  ModelProps,
  SchemaBase
} from "./types"

export type HookOptions = CreateOptions | UpdateOptions | {}

export interface OnQueryOptions {
  includeInternal?: boolean
}

export type OnQueryContext = [string, boolean]

export type OnQueryCallback = Fn<[string]>
export type BeforeCreateCallback <D> = Fn<[D | Partial<D>, CreateOptions]>
export type AfterCreateCallback <D> = Fn<[D, CreateOptions]>
export type BeforeUpdateCallback <D> = Fn<[D | Partial<D>, CriteriaNormalized<D>, UpdateOptions]>
export type AfterUpdateCallback <D> = Fn<[D[], UpdateOptions]>
export type BeforeRemoveCallback <D> = Fn<[CriteriaNormalized<D>, {}]>
export type AfterRemoveCallback <D> = Fn<[D[], {}]>

export type HookCallback <D> =
  | OnQueryCallback
  | BeforeCreateCallback<D>
  | AfterCreateCallback<D>
  | BeforeUpdateCallback<D>
  | AfterUpdateCallback<D>
  | BeforeRemoveCallback<D>
  | AfterRemoveCallback<D>

export interface HookResult {
  prevented: boolean
}

export enum Hook {
  OnQuery = "ON_QUERY",
  BeforeCreate = "BEFORE_CREATE",
  AfterCreate = "AFTER_CREATE",
  BeforeUpdate = "BEFORE_UPDATE",
  AfterUpdate = "AFTER_UPDATE",
  BeforeRemove = "BEFORE_REMOVE",
  AfterRemove = "AFTER_REMOVE"
}

export const EventCancellation = Symbol("trilogy.EventCancellation")

/**
 * Base implementation of lifecycle hooks inherited by all model instances.
 */
export class Hooks <Props extends ModelProps<SchemaBase>> {
  readonly #onQuery = new Set<OnQueryCallback>()
  readonly #onQueryAll = new Set<OnQueryCallback>()

  readonly #beforeCreate = new Set<BeforeCreateCallback<Props["objectInput"]>>()
  readonly #afterCreate = new Set<AfterCreateCallback<Props["objectOutput"]>>()
  readonly #beforeUpdate = new Set<BeforeUpdateCallback<Props["objectOutput"]>>()
  readonly #afterUpdate = new Set<AfterUpdateCallback<Props["objectOutput"]>>()
  readonly #beforeRemove = new Set<BeforeRemoveCallback<Props["objectOutput"]>>()
  readonly #afterRemove = new Set<AfterRemoveCallback<Props["objectOutput"]>>()

  /**
   * The `onQuery` hook is called each time a query is run on the database,
   * and receives the query in string form.
   *
   * @param fn Function called when the hook is triggered
   * @param [options]
   *
   * @returns Unsubscribe function that removes the subscriber when called
   */
  onQuery (fn: OnQueryCallback, options: OnQueryOptions = {}): () => boolean {
    invariant(
      typeof fn === "function",
      "hook callbacks must be of type function"
    )

    if (options.includeInternal) {
      this.#onQuery.add(fn)
      this.#onQueryAll.add(fn)
      return (): boolean =>
        this.#onQueryAll.delete(fn) && this.#onQuery.delete(fn)
    } else {
      this.#onQuery.add(fn)
      return (): boolean =>
        this.#onQuery.delete(fn)
    }
  }

  /**
   * Before an object is created, the beforeCreate hook is called with the
   * object.
   *
   * @remarks
   * This hook occurs before casting, so if a subscriber to this hook
   * modifies the incoming object those changes will be subject to casting.
   * It's also possible to prevent the object from being created entirely
   * by returning the EventCancellation symbol from a subscriber callback.
   *
   * @param fn Function called when the hook is triggered
   *
   * @returns Unsubscribe function that removes the subscriber when called
   */
  beforeCreate (fn: BeforeCreateCallback<Props["objectInput"]>): () => boolean {
    invariant(
      typeof fn === "function",
      "hook callbacks must be of type function"
    )

    this.#beforeCreate.add(fn)
    return (): boolean => this.#beforeCreate.delete(fn)
  }

  /**
   * When an object is created, that object is returned to you and the
   * `afterCreate` hook is called with it.
   *
   * @param fn Function called when the hook is triggered
   *
   * @returns Unsubscribe function that removes the subscriber when called
   */
  afterCreate (fn: AfterCreateCallback<Props["objectOutput"]>): () => boolean {
    invariant(
      typeof fn === "function",
      "hook callbacks must be of type function"
    )

    this.#afterCreate.add(fn)
    return (): boolean => this.#afterCreate.delete(fn)
  }

  /**
   * Prior to an object being updated the `beforeUpdate` hook is called with the
   * update delta, or the incoming changes to be made, as well as the criteria.
   *
   * @remarks
   * Casting occurs after this hook. A subscriber could choose to cancel the
   * update by returning the EventCancellation symbol or alter the selection
   * criteria.
   *
   * @param fn Function called when the hook is triggered
   *
   * @returns Unsubscribe function that removes the subscriber when called
   */
  beforeUpdate (fn: BeforeUpdateCallback<Props["objectOutput"]>): () => boolean {
    invariant(
      typeof fn === "function",
      "hook callbacks must be of type function"
    )

    this.#beforeUpdate.add(fn)
    return (): boolean => this.#beforeUpdate.delete(fn)
  }

  /**
   * Subscribers to the `afterUpdate` hook receive modified objects after they
   * are updated.
   *
   * @param fn Function called when the hook is triggered
   *
   * @returns Unsubscribe function that removes the subscriber when called
   */
  afterUpdate (fn: AfterUpdateCallback<Props["objectOutput"]>): () => boolean {
    invariant(
      typeof fn === "function",
      "hook callbacks must be of type function"
    )

    this.#afterUpdate.add(fn)
    return (): boolean => this.#afterUpdate.delete(fn)
  }

  /**
   * Before object removal, the criteria for selecting those objects is passed
   * to the `beforeRemove` hook.
   *
   * @remarks
   * Casting occurs after this hook. Subscribers can modify the selection
   * criteria or prevent the removal entirely by returning the `EventCancellation`
   * symbol.
   *
   * @param fn Function called when the hook is triggered
   *
   * @returns Unsubscribe function that removes the subscriber when called
   */
  beforeRemove (fn: BeforeRemoveCallback<Props["objectOutput"]>): () => boolean {
    invariant(
      typeof fn === "function",
      "hook callbacks must be of type function"
    )

    this.#beforeRemove.add(fn)
    return (): boolean => this.#beforeRemove.delete(fn)
  }

  /**
   * A list of any removed objects is passed to the `afterRemove` hook.
   *
   * @param fn Function called when the hook is triggered
   *
   * @returns Unsubscribe function that removes the subscriber when called
   */
  afterRemove (fn: AfterRemoveCallback<Props["objectOutput"]>): () => boolean {
    invariant(
      typeof fn === "function",
      "hook callbacks must be of type function"
    )

    this.#afterRemove.add(fn)
    return (): boolean => this.#afterRemove.delete(fn)
  }

  /**
   * The main handler of all hooks.
   *
   * @internal
   */
  async _callHook <T = Props["objectOutput"]> (
    hook: Hook.OnQuery, arg: OnQueryContext
  ): Promise<HookResult>
  async _callHook <T = Props["objectInput"]> (
    hook: Hook.BeforeCreate, arg: T | Partial<T>, options?: CreateOptions
  ): Promise<HookResult>
  async _callHook <T = Props["objectOutput"]> (
    hook: Hook.AfterCreate, arg: T, options?: CreateOptions
  ): Promise<HookResult>
  async _callHook <T = Props["objectOutput"]> (
    hook: Hook.BeforeUpdate, arg: [T | Partial<T>, Criteria<T>], options?: UpdateOptions
  ): Promise<HookResult>
  async _callHook <T = Props["objectOutput"]> (
    hook: Hook.AfterUpdate, arg: T[], options?: UpdateOptions
  ): Promise<HookResult>
  async _callHook <T = Props["objectOutput"]> (
    hook: Hook.BeforeRemove, arg: Criteria<T>, options?: {}
  ): Promise<HookResult>
  async _callHook <T = Props["objectOutput"]> (
    hook: Hook.AfterRemove, arg: T[], options?: {}
  ): Promise<HookResult>

  async _callHook <T = Props["objectInput"] | Props["objectOutput"]> (
    hook: Hook,
    arg: T | Partial<T> | [T | Partial<T>, Criteria<T>] | Criteria<T> | OnQueryContext,
    options?: HookOptions
  ): Promise<HookResult> {
    const result: HookResult = {
      prevented: false
    }

    if (hook === Hook.OnQuery) {
      const [query, internal] = arg as OnQueryContext
      const fns = internal ? this.#onQueryAll : this.#onQuery

      for (const fn of fns) {
        if (await fn(query) === EventCancellation) {
          result.prevented = true
        }
      }

      return result
    }

    const fns = ({
      [Hook.BeforeCreate]: this.#beforeCreate,
      [Hook.AfterCreate]: this.#afterCreate,
      [Hook.BeforeUpdate]: this.#beforeUpdate,
      [Hook.AfterUpdate]: this.#afterUpdate,
      [Hook.BeforeRemove]: this.#beforeRemove,
      [Hook.AfterRemove]: this.#afterRemove
    })[hook]

    for (const fn of fns) {
      let thisResult: unknown

      if (hook === Hook.BeforeUpdate) {
        const [data, criteria] = arg as [T | Partial<T>, Criteria<T>]
        thisResult = await (
          fn as BeforeUpdateCallback<T>
        )(data, normalizeCriteria(criteria), options ?? {})
      } else if (hook === Hook.BeforeRemove) {
        thisResult = await (
          fn as BeforeRemoveCallback<T>
        )(normalizeCriteria(arg as Criteria<T>), options ?? {})
      } else if (hook === Hook.BeforeCreate || hook === Hook.AfterCreate) {
        thisResult = await (
          fn as BeforeCreateCallback<T> | AfterCreateCallback<T>
        )(arg as T, options ?? {})
      } else {
        thisResult = await (
          fn as AfterUpdateCallback<T> | AfterRemoveCallback<T>
        )(arg as T[], options ?? {})
      }

      if (thisResult === EventCancellation) {
        result.prevented = true
      }
    }

    return result
  }
}
