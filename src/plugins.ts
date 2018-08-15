import { Trilogy } from '.'
import { LooseObject } from './types'

export type Constructor <T> = new (...args: any[]) => T
export type PluginBase = Constructor<Trilogy>

export interface Plugin <T = LooseObject> {
  (TrilogyBase: PluginBase): Constructor<Trilogy & T>
}

// please for the love of all that is good in the cosmos:
// https://github.com/Microsoft/TypeScript/issues/5453

// tslint:disable:max-line-length
export interface Mix {
  <A> (plugins: [Plugin<A>]): Constructor<A & Trilogy>
  <A, B> (plugins: [Plugin<A>, Plugin<B>]): Constructor<B & A & Trilogy>
  <A, B, C> (plugins: [Plugin<A>, Plugin<B>, Plugin<C>]): Constructor<C & B & A & Trilogy>
  <A, B, C, D> (plugins: [Plugin<A>, Plugin<B>, Plugin<C>, Plugin<D>]): Constructor<D & C & B & A & Trilogy>
  <A, B, C, D, E> (plugins: [Plugin<A>, Plugin<B>, Plugin<C>, Plugin<D>, Plugin<E>]): Constructor<E & D & C & B & A & Trilogy>
  <A, B, C, D, E, F> (plugins: [Plugin<A>, Plugin<B>, Plugin<C>, Plugin<D>, Plugin<E>, Plugin<F>]): Constructor<F & E & D & C & B & A & Trilogy>
  <A, B, C, D, E, F, G> (plugins: [Plugin<A>, Plugin<B>, Plugin<C>, Plugin<D>, Plugin<E>, Plugin<F>, Plugin<G>]): Constructor<G & F & E & D & C & B & A & Trilogy>
  <A, B, C, D, E, F, G, H> (plugins: [Plugin<A>, Plugin<B>, Plugin<C>, Plugin<D>, Plugin<E>, Plugin<F>, Plugin<G>, Plugin<H>]): Constructor<H & G & F & E & D & C & B & A & Trilogy>
  <A, B, C, D, E, F, G, H, I> (plugins: [Plugin<A>, Plugin<B>, Plugin<C>, Plugin<D>, Plugin<E>, Plugin<F>, Plugin<G>, Plugin<H>, Plugin<I>]): Constructor<I & H & G & F & E & D & C & B & A & Trilogy>
  <A, B, C, D, E, F, G, H, I, J> (plugins: [Plugin<A>, Plugin<B>, Plugin<C>, Plugin<D>, Plugin<E>, Plugin<F>, Plugin<G>, Plugin<H>, Plugin<I>, Plugin<J>]): Constructor<J & I & H & G & F & E & D & C & B & A & Trilogy>
  <A, B, C, D, E, F, G, H, I, J, K> (plugins: [Plugin<A>, Plugin<B>, Plugin<C>, Plugin<D>, Plugin<E>, Plugin<F>, Plugin<G>, Plugin<H>, Plugin<I>, Plugin<J>, Plugin<K>]): Constructor<K & J & I & H & G & F & E & D & C & B & A & Trilogy>
  <A, B, C, D, E, F, G, H, I, J, K, L> (plugins: [Plugin<A>, Plugin<B>, Plugin<C>, Plugin<D>, Plugin<E>, Plugin<F>, Plugin<G>, Plugin<H>, Plugin<I>, Plugin<J>, Plugin<K>, Plugin<L>]): Constructor<L & K & J & I & H & G & F & E & D & C & B & A & Trilogy>
}
// tslint:enable:max-line-length

export const mix: Mix = (plugins: any[]) => {
  return plugins.reduce((base, plugin) => {
    return plugin(base)
  }, Trilogy)
}
