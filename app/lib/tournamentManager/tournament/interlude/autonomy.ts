

// ---------------------------------------------
// Functional Helpers
// ---------------------------------------------
export let id = (x: any) => x;
export let noop = function () { };
export let not = (fn: (arg0: any) => any) => (x: any) => !fn(x);
export let all = (fn: any) => (xs: any[]) => xs.every(fn);
export let any = (fn: any) => (xs: any[]) => xs.some(fn);
export let none = (fn: any) => (xs: any[]) => !xs.some(fn);
export let elem = (xs: string | any[]) => (x: any) => xs.indexOf(x) >= 0;
export let notElem = (xs: string | any[]) => (x: any) => xs.indexOf(x) < 0;
export let extend = Object.assign;

// ---------------------------------------------
// Math
// ---------------------------------------------
export let gcd = function (a_: number, b_: number) {
  var a = Math.abs(a_);
  var b = Math.abs(b_);
  while (b) {
    var temp = b;
    b = a % b;
    a = temp;
  }
  return a;
};
export let lcm = (a: number, b: number) => (!a || !b) ? 0 : Math.abs((a * b) / gcd(a, b));

export let even = (n: number) => n % 2 === 0;
export let odd = (n: number) => n % 2 === 1;

// ---------------------------------------------
// Property accessors
// ---------------------------------------------

export let first = (xs: any[]) => xs[0];
export let last = (xs: string | any[]) => xs[xs.length - 1];

export let firstBy = function <T>(fn: (arg0: T) => boolean, xs: T[]) {
  for (var i = 0, len = xs.length; i < len; i += 1) {
    if (fn(xs[i])) {
      return xs[i];
    }
  }
};
export let lastBy = function (fn: (arg0: any) => any, xs: string | any[]) {
  for (var i = xs.length - 1; i >= 0; i -= 1) {
    if (fn(xs[i])) {
      return xs[i];
    }
  }
};

// ---------------------------------------------
// Higher order looping
// ---------------------------------------------
export let range = (length: any) => Array.from({ length }, (v, k) => k + 1);
export let interval = function (start: number, stop: number) {
  return Array.from({ length: stop - start + 1 }, (v, k) => start + k);
};
export let replicate = <T>(length: number, fn: (v: T, k: number) => T) => Array.from({ length }, fn);
export let iterate = function (times: number, init: any, fn: (arg0: any) => any) {
  var result = [init];
  for (var i = 1; i < times; i += 1) {
    result.push(fn(result[i - 1]));
  }
  return result;
};

export let zipWith2 = function <X, Y, R>(fn: (arg0: X, arg1: Y) => R, xs: X[], ys: Y[]): R[] {
  var length = Math.min(xs.length, ys.length);
  return Array.from({ length }, (v, k) => fn(xs[k], ys[k]));
};
export let zipWith3 = function <X, Y, Z, R>(fn: (arg0: X, arg1: Y, arg2: Z) => R, xs: X[], ys: Y[], zs: Z[]): R[] {
  var length = Math.min(xs.length, ys.length, zs.length);
  return Array.from({ length }, (v, k) => fn(xs[k], ys[k], zs[k]));
};
export let zipWith4 = function <X, Y, Z, W, R>(fn: (arg0: X, arg1: Y, arg2: Z, arg3: W) => R, xs: X[], ys: Y[], zs: Z[], ws: W[]): R[] {
  var length = Math.min(xs.length, ys.length, zs.length, ws.length);
  return Array.from({ length }, (v, k) => fn(xs[k], ys[k], zs[k], ws[k]));
};

export let zip2 = <X, Y>(xs: X[], ys: Y[]) => zipWith2((x, y) => [x, y] as [X, Y], xs, ys);
export let zip3 = <X, Y, Z>(xs: X[], ys: Y[], zs: Z[]) => zipWith3(((x, y, z) => [x, y, z] as [X, Y, Z]), xs, ys, zs);
export let zip4 = <X, Y, Z, W>(xs: X[], ys: Y[], zs: Z[], ws: W[]) => zipWith4((x, y, z, w) => [x, y, z, w] as [X, Y, Z, W], xs, ys, zs, ws);

// sensible defaults
export let zipWith = zipWith2;
export let zip = zip2;

// ---------------------------------------------
// Curried Prototype Accessors
// ---------------------------------------------
export let reduce = (fn: any, init: any) => (xs: any[]) => xs.reduce(fn, init);
export let map = (fn: any) => (xs: any[]) => xs.map(fn);
export let filter = (fn: any) => (xs: any[]) => xs.filter(fn);

