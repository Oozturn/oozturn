import { range } from "~/lib/utils/ranges"

interface Result {
    name: string,
    for: number,
    against: number
}


const results: Result[] = [
    {name: 'a', for: 5, against: 6},
    {name: 'b', for: 10, against: 1},
    {name: 'c', for: 2, against: 14},
    {name: 'd', for: 8, against: 0},
    {name: 'e', for: 3, against: 8},
    {name: 'f', for: 14, against: 2},
    {name: 'g', for: 5, against: 8},
    {name: 'h', for: 9, against: 12},
    {name: 'i', for: 9, against: 14},
]

console.log('base', JSON.stringify(results.slice().map(r => r.name)))
console.log('base', JSON.stringify(results.slice().sort(usingDiff).map(r => r.name)), JSON.stringify(results.slice().sort(usingDiff).map(r => r.for - r.against)))
console.log('base', JSON.stringify(results.slice().sort(usingDiffForAgainst).map(r => r.name)), JSON.stringify(results.slice().sort(usingDiffForAgainst).map(r => r.for - r.against)))
console.log('base', JSON.stringify(results.slice().sort(usingRatio).map(r => r.name)), JSON.stringify(results.slice().sort(usingRatio).map(r => r.for / r.against)))
console.log('base', JSON.stringify(results.slice().sort(usingDiffForAgainst).map(r => r.name)), JSON.stringify(results.slice().sort(usingDiffForAgainst).map(r => (r.for - r.against)/(r.for + r.against))))


function usingDiff(a: Result, b: Result) {
    return (b.for-b.against) - (a.for-a.against)
}

function usingDiffForAgainst(a: Result, b: Result) {
    return ((b.for-b.against) - (a.for-a.against)) || (b.for - a.for)
}

function usingRatio(a: Result, b: Result) {
    return (b.for/b.against) - (a.for/a.against)
}

console.log(range(2, 0, -1))