var FFA = require('ffa');
import { FFA as FFATS } from './ffa'
import { Match } from './match';


let checkSameStateAndMatch = function (
  parameters: ConstructorParameters<typeof FFATS>,
  operationsFn?: (tournament: FFATS) => void,
  testFn?: (tournament: FFATS) => void
) {
  let tournament = new FFA(...parameters)
  let tournamentTS = new FFATS(...parameters)

  if (operationsFn) {
    operationsFn(tournament)
    operationsFn(tournamentTS)
  }

  test('has same state', () => {
    expect(tournamentTS.state).toEqual(tournament.state)
  })
  test('has same matches', () => {
    expect(tournamentTS.matches).toEqual(tournament.matches)
  })

  if (testFn) {
    testFn(tournamentTS)
  }
}

describe('FFA 10 players', () => {
  checkSameStateAndMatch([10, {}])
});

describe('FFA 16 match of 4 players until done', () => {
  checkSameStateAndMatch([16, { sizes: [4, 4, 4], advancers: [2, 2] }],
    (ffa) => {
      ffa.score({ s: 1, r: 1, m: 1 }, [1, 2, 3, 4])
      ffa.score({ s: 1, r: 1, m: 2 }, [1, 2, 3, 4])
      ffa.score({ s: 1, r: 1, m: 3 }, [1, 2, 3, 4])
      ffa.score({ s: 1, r: 1, m: 4 }, [1, 2, 3, 4])
      ffa.score({ s: 1, r: 2, m: 1 }, [1, 2, 3, 4]) // semi 1
      ffa.score({ s: 1, r: 2, m: 2 }, [1, 2, 3, 4]) // semi 2
      ffa.score({ s: 1, r: 3, m: 1 }, [1, 2, 3, 4]) // final
    },
    (ffa) => {
      test('match ended', () => {
        expect(ffa.isDone())
      })
    })
});

test('FFA 9, match of 3, winner with higherscore', () => {
  let ffa = new FFATS(9, { sizes: [3, 3], advancers: [1] })
  ffa.score({ s: 1, r: 1, m: 1 }, [3, 2, 1]) // 1 vs 4 vs 9, 1 win
  ffa.score({ s: 1, r: 1, m: 2 }, [3, 2, 1]) // 2 vs 5 vs 8, 2 win
  ffa.score({ s: 1, r: 1, m: 3 }, [3, 2, 1]) // 3 vs 6 vs 7, 3 win
  ffa.score({ s: 1, r: 2, m: 1 }, [3, 2, 1]) // 1 vs 2 vs 3, 1 win
  expect(ffa.results()).toEqual(
    [
      { "seed": 1, "wins": 2, "for": 6, "against": 0, "pos": 1, "gpos": 1 },
      { "seed": 2, "wins": 1, "for": 5, "against": 1, "pos": 2, "gpos": 2 },
      { "seed": 3, "wins": 1, "for": 4, "against": 2, "pos": 3, "gpos": 3 },
      { "seed": 4, "wins": 0, "for": 2, "against": 1, "pos": 4 },
      { "seed": 5, "wins": 0, "for": 2, "against": 1, "pos": 4 },
      { "seed": 6, "wins": 0, "for": 2, "against": 1, "pos": 4 },
      { "seed": 7, "wins": 0, "for": 1, "against": 2, "pos": 7 },
      { "seed": 8, "wins": 0, "for": 1, "against": 2, "pos": 7 },
      { "seed": 9, "wins": 0, "for": 1, "against": 2, "pos": 7 }
    ]
  )
});

test('FFA 9, match of 3, winner with lowerscore', () => {
  let ffa = new FFATS(9, { sizes: [3, 3], advancers: [1], lowerScoreIsBetter: true })
  ffa.score({ s: 1, r: 1, m: 1 }, [1, 2, 3]) // 1 vs 4 vs 9, 1 win
  ffa.score({ s: 1, r: 1, m: 2 }, [1, 2, 3]) // 2 vs 5 vs 8, 2 win
  ffa.score({ s: 1, r: 1, m: 3 }, [1, 2, 3]) // 3 vs 6 vs 7, 3 win
  ffa.score({ s: 1, r: 2, m: 1 }, [1, 2, 3]) // 1 vs 2 vs 3, 1 win
  expect(ffa.results()).toEqual(
    [
      { "seed": 1, "wins": 2, "for": 2, "against": 0, "pos": 1, "gpos": 1 },
      { "seed": 2, "wins": 1, "for": 3, "against": 1, "pos": 2, "gpos": 2 },
      { "seed": 3, "wins": 1, "for": 4, "against": 2, "pos": 3, "gpos": 3 },
      { "seed": 4, "wins": 0, "for": 2, "against": 1, "pos": 4 },
      { "seed": 5, "wins": 0, "for": 2, "against": 1, "pos": 4 },
      { "seed": 6, "wins": 0, "for": 2, "against": 1, "pos": 4 },
      { "seed": 7, "wins": 0, "for": 3, "against": 2, "pos": 7 },
      { "seed": 8, "wins": 0, "for": 3, "against": 2, "pos": 7 },
      { "seed": 9, "wins": 0, "for": 3, "against": 2, "pos": 7 }
    ]
  )
});