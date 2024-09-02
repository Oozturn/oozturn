/* eslint-disable @typescript-eslint/no-explicit-any */
// multi-parameter versions for the associative operators
export const plus2 = (x: any, y: any) => x + y
export const plus3 = (x: any, y: any, z: any) => x + y + z
export const plus4 = (x: any, y: any, z: any, w: any) => x + y + z + w
export const times2 = (x: number, y: number) => x * y
export const times3 = (x: number, y: number, z: number) => x * y * z
export const times4 = (x: number, y: number, z: number, w: number) => x * y * z * w
export const and2 = (x: any, y: any) => x && y
export const and3 = (x: any, y: any, z: any) => x && y && z
export const and4 = (x: any, y: any, z: any, w: any) => x && y && z && w
export const or2 = (x: any, y: any) => x || y
export const or3 = (x: any, y: any, z: any) => x || y || z
export const or4 = (x: any, y: any, z: any, w: any) => x || y || z || w

// same, but on arrays
export const append2 = (xs: string | any[], ys: any) => xs.concat(ys)
export const append3 = (xs: string | any[], ys: any, zs: any) => xs.concat(ys, zs)
export const append4 = (xs: string | any[], ys: any, zs: any, ws: any) => xs.concat(ys, zs, ws)
export const prepend2 = (xs: any, ys: string | any[]) => ys.concat(xs)

export const sum = (xs: any[]) => xs.reduce((acc: any, el: any) => acc + el, 0)
export const product = (xs: any[]) => xs.reduce((acc: number, el: number) => acc * el, 1)
export const and = (xs: any[]) => xs.reduce((acc: any, el: any) => acc && el, true)
export const or = (xs: any[]) => xs.reduce((acc: any, el: any) => acc || el, false)
export const flatten = <T>(xs: T[][]): T[] => Array.prototype.concat.apply([], xs)

// non-associative operators only get the 2 argument version
export const minus2 = (x: number, y: number) => x - y
export const divide2 = (x: number, y: number) => x / y
export const div2 = (x: number, y: number) => Math.floor(x / y)
export const mod2 = (x: number, y: number) => x % y
export const pow2 = Math.pow
export const log2 = (x: number, y: number) => Math.log(x) / Math.log(y)
export const eq2 = (x: any, y: any) => x === y
export const neq2 = (x: any, y: any) => x !== y
export const gt2 = (x: number, y: number) => x > y
export const lt2 = (x: number, y: number) => x < y
export const gte2 = (x: number, y: number) => x >= y
export const lte2 = (x: number, y: number) => x <= y

// curried versions
export const plus = (y: any) => (x: any) => x + y
export const minus = (y: number) => (x: number) => x - y
export const times = (y: number) => (x: number) => x * y
export const divide = (y: number) => (x: number) => x / y
export const div = (y: number) => (x: number) => Math.floor(x / y)
export const mod = (y: number) => (x: number) => x % y
export const pow = (y: number) => (x: number) => Math.pow(x, y)
export const log = (y: number) => (x: number) => Math.log(x) / Math.log(y)
export const append = (ys: any) => (xs: string | any[]) => xs.concat(ys)
export const prepend = (ys: string | any[]) => (xs: any) => ys.concat(xs)
export const gt = (y: number) => (x: number) => x > y
export const lt = (y: number) => (x: number) => x < y
export const eq = (y: any) => (x: any) => x === y
export const neq = (y: any) => (x: any) => x !== y
export const gte = (y: number) => (x: number) => x >= y
export const lte = (y: number) => (x: number) => x <= y
