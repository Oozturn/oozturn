type Order = 1|-1

// ---------------------------------------------
// Comparison and Equality
// ---------------------------------------------

let eq2 = <T>(x: T, y: T) => x === y; // used throughout
export let equality = <T>(prop: string) => (x: { [x: string]: T; }, y: { [x: string]: T; }) => x[prop] === y[prop];
export let equalityBy = <T>(costFn: (input: T) => any) => (x: T, y: T) => costFn(x) === costFn(y);
export let compare = (order?: Order) => (x: number, y: number) => (order || 1)*(x - y);
export let compareBy = (costFn: (arg0: any) => number, order: Order) => (x: any, y: any) => (order || 1)*(costFn(x) - costFn(y));
export let comparing = (prop: string, order: Order) => (x: { [x: string]: number; }, y: { [x: string]: number; }) => (order || 1)*(x[prop] - y[prop]);

// ---------------------------------------------
// Max/min + subset checks
// ---------------------------------------------

// max/min
export let maximum = (xs: number[]) => Math.max.apply(Math, xs);
export let minimum = (xs: number[]) => Math.min.apply(Math, xs);

// generalized max/min - cannot be called on an empty array
export let maximumBy = (cmpFn: (arg0: any, arg1: any) => number, xs: any[]) => xs.reduce((max: any, x: any) => cmpFn(x, max) > 0 ? x : max, xs[0]);
export let minimumBy = (cmpFn: (arg0: any, arg1: any) => number, xs: any[]) => xs.reduce((min: any, x: any) => cmpFn(x, min) < 0 ? x : min, xs[0]);

// subset checks - does not account for duplicate elements in xs or ys
export let isSubsetOf = (xs: any[], ys: string | any[]) => xs.every((x: any) => ys.indexOf(x) >= 0);
export let isProperSubsetOf = function (xs: any[], ys: any[]) {
  return isSubsetOf(xs, ys) && ys.some((y: any) => xs.indexOf(y) < 0);
};

// ---------------------------------------------
// Set Operations
// ---------------------------------------------

// generalized indexOf
export let indexOfBy = function (eq: (arg0: any, arg1: any) => any, xs: string | any[], x: any) {
  for (var i = 0, len = xs.length; i < len; i += 1) {
    if (eq(xs[i], x)) {
      return i;
    }
  }
  return -1;
};

// Modifying Array operations
export let insertBy = function (cmp: (arg0: any, arg1: any) => number, xs: any[], x: any) {
  for (var i = 0, len = xs.length; i < len; i += 1) {
    if (cmp(xs[i], x) >= 0) {
      xs.splice(i, 0, x);
      return xs;
    }
  }
  xs.push(x);
  return xs;
};
export let insert = (xs: any, x: any) => insertBy(compare(), xs, x);

export let deleteBy = function (eq: any, xs: any[], x: any) {
  var idx = indexOfBy(eq, xs, x);
  if (idx >= 0) {
    xs.splice(idx, 1);
  }
  return xs;
};
export let delete2 = (xs: any, x: any) => deleteBy(eq2, xs, x);

// Pure operations
export let intersectBy = function (eq: any, xs: any[], ys: any) {
  return xs.reduce((acc: any[], x: any) => {
    if (indexOfBy(eq, ys, x) >= 0) {
      acc.push(x);
    }
    return acc;
  }, []);
};
export let intersect = (xs: any, ys: any) => intersectBy(eq2, xs, ys);

export let uniqueBy = function <T>(eqFn : (x:T,y:T) => boolean, array:T[]) {
  return array.reduce((acc:T[], x) => {
    if (indexOfBy(eqFn, acc, x) < 0) {
      acc.push(x);
    }
    return acc;
  }, []);
};
export let unique = <T>(xs : T[]) => uniqueBy<T>(eq2, xs);

export let groupBy = function (eq: (arg0: any, arg1: any) => any, xs: string | any[]) {
  var result = [];
  for (var i = 0, j = 0, len = xs.length; i < len; i = j) {
    for (j = i + 1; j < len && eq(xs[i], xs[j]);) { j += 1; }
    result.push(xs.slice(i, j));
  }
  return result;
};
export let group = (xs: any) => groupBy(eq2, xs);

export let unionBy = function (eq: any, xs: any[], ys: any) {
  return xs.concat(xs.reduce(deleteBy.bind(null, eq), uniqueBy(eq, ys)));
};
export let union = (xs: any[], ys: any) => xs.concat(xs.reduce(delete2, unique(ys)));

export let differenceBy = (eq: any, xs: string | any[], ys: any[]) => ys.reduce(deleteBy.bind(null, eq), xs.slice());
export let difference = (xs: string | any[], ys: any[]) => ys.reduce(delete2, xs.slice());
