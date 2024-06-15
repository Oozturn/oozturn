// multi-parameter versions for the associative operators
export let plus2 = (x: any, y: any) => x + y;
export let plus3 = (x: any, y: any, z: any) => x + y + z;
export let plus4 = (x: any, y: any, z: any, w: any) => x + y + z + w;
export let times2 = (x: number, y: number) => x * y;
export let times3 = (x: number, y: number, z: number) => x * y * z;
export let times4 = (x: number, y: number, z: number, w: number) => x * y * z * w;
export let and2 = (x: any, y: any) => x && y;
export let and3 = (x: any, y: any, z: any) => x && y && z;
export let and4 = (x: any, y: any, z: any, w: any) => x && y && z && w;
export let or2 = (x: any, y: any) => x || y;
export let or3 = (x: any, y: any, z: any) => x || y || z;
export let or4 = (x: any, y: any, z: any, w: any) => x || y || z || w;

// same, but on arrays
export let append2 = (xs: string | any[], ys: any) => xs.concat(ys);
export let append3 = (xs: string | any[], ys: any, zs: any) => xs.concat(ys, zs);
export let append4 = (xs: string | any[], ys: any, zs: any, ws: any) => xs.concat(ys, zs, ws);
export let prepend2 = (xs: any, ys: string | any[]) => ys.concat(xs);

export let sum = (xs: any[]) => xs.reduce((acc: any, el: any) => acc + el, 0);
export let product = (xs: any[]) => xs.reduce((acc: number, el: number) => acc * el, 1);
export let and = (xs: any[]) => xs.reduce((acc: any, el: any) => acc && el, true);
export let or = (xs: any[]) => xs.reduce((acc: any, el: any) => acc || el, false);
export let flatten = <T>(xs: T[][]): T[] => Array.prototype.concat.apply([], xs);

// non-associative operators only get the 2 argument version
export let minus2 = (x: number, y: number) => x - y;
export let divide2 = (x: number, y: number) => x / y;
export let div2 = (x: number, y: number) => Math.floor(x / y);
export let mod2 = (x: number, y: number) => x % y;
export let pow2 = Math.pow;
export let log2 = (x: number, y: number) => Math.log(x) / Math.log(y);
export let eq2 = (x: any, y: any) => x === y;
export let neq2 = (x: any, y: any) => x !== y;
export let gt2 = (x: number, y: number) => x > y;
export let lt2 = (x: number, y: number) => x < y;
export let gte2 = (x: number, y: number) => x >= y;
export let lte2 = (x: number, y: number) => x <= y;

// curried versions
export let plus = (y: any) => (x: any) => x + y;
export let minus = (y: number) => (x: number) => x - y;
export let times = (y: number) => (x: number) => x * y;
export let divide = (y: number) => (x: number) => x / y;
export let div = (y: number) => (x: number) => Math.floor(x / y);
export let mod = (y: number) => (x: number) => x % y;
export let pow = (y: number) => (x: number) => Math.pow(x, y);
export let log = (y: number) => (x: number) => Math.log(x) / Math.log(y);
export let append = (ys: any) => (xs: string | any[]) => xs.concat(ys);
export let prepend = (ys: string | any[]) => (xs: any) => ys.concat(xs);
export let gt = (y: number) => (x: number) => x > y;
export let lt = (y: number) => (x: number) => x < y;
export let eq = (y: any) => (x: any) => x === y;
export let neq = (y: any) => (x: any) => x !== y;
export let gte = (y: number) => (x: number) => x >= y;
export let lte = (y: number) => (x: number) => x <= y;
