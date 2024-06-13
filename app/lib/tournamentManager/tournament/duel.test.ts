var Duel = require('duel');
import { Duel as DuelTS } from './duel'
import { expect, test, describe } from '@jest/globals';


let checkSameStateAndMatch = function (
  parameters: ConstructorParameters<typeof DuelTS>,
  operationsFn?: (duel: DuelTS) => void,
  testFn?: (duel: DuelTS) => void
) {
  let duel = new Duel(...parameters)
  let duelTS = new DuelTS(...parameters)

  if (operationsFn) {
    operationsFn(duel)
    operationsFn(duelTS)
  }

  test('has same state', () => {
    expect(duelTS.state).toEqual(duel.state)
  })
  test('has same matches', () => {
    expect(duelTS.matches).toEqual(duel.matches)
  })

  if (testFn) {
    testFn(duelTS)
  }
}

describe('Duel 4 players', () => {
  checkSameStateAndMatch([4, {}])
});

describe('Duel 4 players with score', () => {
  checkSameStateAndMatch([4, {}], (duel) => {
    let match1 = duel.matches[0]
    duel.score(match1.id, [10, 0])
  })
});

describe('Duel 4 players until done', () => {
  checkSameStateAndMatch([4, {}],
    (duel) => {
      duel.score({ s: Duel.WB, r: 1, m: 1 }, [10, 0])
      duel.score({ s: Duel.WB, r: 1, m: 2 }, [10, 0])
      duel.score({ s: Duel.WB, r: 2, m: 1 }, [10, 0])
      duel.score({ s: Duel.LB, r: 1, m: 1 }, [10, 0])
    },
    (duel) => {
      test('match ended', () => {
        expect(duel.isDone())
      })
    })
});

test('Duel 4 players winner with higherscore', () => {
  let duel = new DuelTS(4, {})
  duel.score({ s: Duel.WB, r: 1, m: 1 }, [10, 0]) // 1 vs 4, 1 win
  duel.score({ s: Duel.WB, r: 1, m: 2 }, [0, 10]) // 3 vs 2, 2 win
  duel.score({ s: Duel.WB, r: 2, m: 1 }, [10, 0]) // 1 vs 2, 1 win
  duel.score({ s: Duel.LB, r: 1, m: 1 }, [0, 10]) // 4 vs 3, 3 win
  expect(duel.results()).toEqual(
    [
      { "seed": 1, "wins": 2, "for": 20, "against": 0, "pos": 1 },
      { "seed": 2, "wins": 1, "for": 10, "against": 10, "pos": 2 },
      { "seed": 3, "wins": 1, "for": 10, "against": 10, "pos": 3 },
      { "seed": 4, "wins": 0, "for": 0, "against": 20, "pos": 4 }
    ]
  )
});

test('Duel 4 players winner with lowerscore', () => {
  let duel = new DuelTS(4, { lowerScoreIsBetter: true })
  duel.score({ s: Duel.WB, r: 1, m: 1 }, [0, 10]) // 1 vs 4, 1 win
  duel.score({ s: Duel.WB, r: 1, m: 2 }, [10, 0]) // 3 vs 2, 2 win
  duel.score({ s: Duel.WB, r: 2, m: 1 }, [0, 10]) // 1 vs 2, 1 win
  duel.score({ s: Duel.LB, r: 1, m: 1 }, [10, 0]) // 4 vs 3, 3 win
  expect(duel.results()).toEqual(
    [
      { "seed": 1, "wins": 2, "for": 0, "against": 20, "pos": 1 },
      { "seed": 2, "wins": 1, "for": 10, "against": 10, "pos": 2 },
      { "seed": 3, "wins": 1, "for": 10, "against": 10, "pos": 3 },
      { "seed": 4, "wins": 0, "for": 20, "against": 0, "pos": 4 }
    ]
  )
})

test('Duel 5 players with higherscore', () => {
  let duel = new DuelTS(5, {})
  //R1 M1 -> 1 alone
  duel.score({ s: Duel.WB, r: 1, m: 2 }, [0, 10]) //5 vs 4, 4 win
  //R1 M3 -> 3 alone
  //R1 M4 -> 2 alone
  duel.score({ s: Duel.WB, r: 2, m: 1 }, [10, 0]) //1 vs 4, 1 win
  duel.score({ s: Duel.WB, r: 2, m: 2 }, [0, 10]) //3 vs 2, 2 win
  duel.score({ s: Duel.WB, r: 3, m: 1 }, [10, 0]) //1 vs 2, 1 win
  duel.score({ s: Duel.LB, r: 1, m: 1 }, [0, 10]) //4 vs 3, 3 win
  expect(duel.results()).toEqual(
    [
      { "seed": 1, "wins": 2, "for": 20, "against": 0, "pos": 1 },
      { "seed": 2, "wins": 1, "for": 10, "against": 10, "pos": 2 },
      { "seed": 3, "wins": 1, "for": 10, "against": 10, "pos": 3 },
      { "seed": 4, "wins": 1, "for": 10, "against": 20, "pos": 4 },
      { "seed": 5, "wins": 0, "for": 0, "against": 10, "pos": 5 }
    ]
  )
})

test('Duel 5 players with lowerscore', () => {
  let duel = new DuelTS(5, {lowerScoreIsBetter:true})
  //R1 M1 -> 1 alone
  duel.score({ s: Duel.WB, r: 1, m: 2 }, [10, 0]) //5 vs 4, 4 win
  //R1 M3 -> 3 alone
  //R1 M4 -> 2 alone
  duel.score({ s: Duel.WB, r: 2, m: 1 }, [0, 10]) //1 vs 4, 1 win
  duel.score({ s: Duel.WB, r: 2, m: 2 }, [10, 0]) //3 vs 2, 2 win
  duel.score({ s: Duel.WB, r: 3, m: 1 }, [0, 10]) //1 vs 2, 1 win
  duel.score({ s: Duel.LB, r: 1, m: 1 }, [10, 0]) //4 vs 3, 3 win
  expect(duel.results()).toEqual(
    [
      { "seed": 1, "wins": 2, "for": 0, "against": 20, "pos": 1 },
      { "seed": 2, "wins": 1, "for": 10, "against": 10, "pos": 2 },
      { "seed": 3, "wins": 1, "for": 10, "against": 10, "pos": 3 },
      { "seed": 4, "wins": 1, "for": 20, "against": 10, "pos": 4 },
      { "seed": 5, "wins": 0, "for": 10, "against": 0, "pos": 5 }
    ]
  )
})