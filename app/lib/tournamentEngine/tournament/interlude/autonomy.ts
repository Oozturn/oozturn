/* eslint-disable @typescript-eslint/no-explicit-any */


// ---------------------------------------------
// Functional Helpers
// ---------------------------------------------
export const id = (x: any) => x
export const noop = function () { }
export const not = (fn: (arg0: any) => any) => (x: any) => !fn(x)
export const all = (fn: any) => (xs: any[]) => xs.every(fn)
export const any = (fn: any) => (xs: any[]) => xs.some(fn)
export const none = (fn: any) => (xs: any[]) => !xs.some(fn)
export const elem = (xs: string | any[]) => (x: any) => xs.indexOf(x) >= 0
export const notElem = (xs: string | any[]) => (x: any) => xs.indexOf(x) < 0
export const extend = Object.assign

// ---------------------------------------------
// Math
// ---------------------------------------------
export const gcd = function (a_: number, b_: number) {
  let a = Math.abs(a_)
  let b = Math.abs(b_)
  while (b) {
    const temp = b
    b = a % b
    a = temp
  }
  return a
}
export const lcm = (a: number, b: number) => (!a || !b) ? 0 : Math.abs((a * b) / gcd(a, b))

export const even = (n: number) => n % 2 === 0
export const odd = (n: number) => n % 2 === 1

// ---------------------------------------------
// Property accessors
// ---------------------------------------------

export const first = (xs: any[]) => xs[0]
export const last = (xs: string | any[]) => xs[xs.length - 1]

export const firstBy = function <T>(fn: (arg0: T) => boolean, xs: T[]) {
  for (let i = 0, len = xs.length; i < len; i += 1) {
    if (fn(xs[i])) {
      return xs[i]
    }
  }
}
export const lastBy = function (fn: (arg0: any) => any, xs: string | any[]) {
  for (let i = xs.length - 1; i >= 0; i -= 1) {
    if (fn(xs[i])) {
      return xs[i]
    }
  }
}

// ---------------------------------------------
// Higher order looping
// ---------------------------------------------
export const range = (length: any) => Array.from({ length }, (v, k) => k + 1)
export const interval = function (start: number, stop: number) {
  return Array.from({ length: stop - start + 1 }, (v, k) => start + k)
}
export const replicate = <T>(length: number, fn: (v: T, k: number) => T) => Array.from({ length }, fn)
export const iterate = function (times: number, init: any, fn: (arg0: any) => any) {
  const result = [init]
  for (let i = 1; i < times; i += 1) {
    result.push(fn(result[i - 1]))
  }
  return result
}

export const zipWith2 = function <X, Y, R>(fn: (arg0: X, arg1: Y) => R, xs: X[], ys: Y[]): R[] {
  const length = Math.min(xs.length, ys.length)
  return Array.from({ length }, (v, k) => fn(xs[k], ys[k]))
}
export const zipWith3 = function <X, Y, Z, R>(fn: (arg0: X, arg1: Y, arg2: Z) => R, xs: X[], ys: Y[], zs: Z[]): R[] {
  const length = Math.min(xs.length, ys.length, zs.length)
  return Array.from({ length }, (v, k) => fn(xs[k], ys[k], zs[k]))
}
export const zipWith4 = function <X, Y, Z, W, R>(fn: (arg0: X, arg1: Y, arg2: Z, arg3: W) => R, xs: X[], ys: Y[], zs: Z[], ws: W[]): R[] {
  const length = Math.min(xs.length, ys.length, zs.length, ws.length)
  return Array.from({ length }, (v, k) => fn(xs[k], ys[k], zs[k], ws[k]))
}

export const zip2 = <X, Y>(xs: X[], ys: Y[]) => zipWith2((x, y) => [x, y] as [X, Y], xs, ys)
export const zip3 = <X, Y, Z>(xs: X[], ys: Y[], zs: Z[]) => zipWith3(((x, y, z) => [x, y, z] as [X, Y, Z]), xs, ys, zs)
export const zip4 = <X, Y, Z, W>(xs: X[], ys: Y[], zs: Z[], ws: W[]) => zipWith4((x, y, z, w) => [x, y, z, w] as [X, Y, Z, W], xs, ys, zs, ws)

// sensible defaults
export const zipWith = zipWith2
export const zip = zip2

// ---------------------------------------------
// Curried Prototype Accessors
// ---------------------------------------------
export const reduce = (fn: any, init: any) => (xs: any[]) => xs.reduce(fn, init)
export const map = (fn: any) => (xs: any[]) => xs.map(fn)
export const filter = (fn: any) => (xs: any[]) => xs.filter(fn)

