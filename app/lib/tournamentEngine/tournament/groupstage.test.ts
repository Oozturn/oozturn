// eslint-disable-next-line @typescript-eslint/no-var-requires, no-var
var GroupStage = require("groupstage")
import { GroupStage as GroupStageTS } from "./groupstage"

const checkSameStateAndMatch = function (
  parameters: ConstructorParameters<typeof GroupStageTS>,
  operationsFn?: (tournament: GroupStageTS) => void,
  testFn?: (tournament: GroupStageTS) => void
) {
  const tournament = new GroupStage(...parameters)
  const tournamentTS = new GroupStageTS(...parameters)

  if (operationsFn) {
    operationsFn(tournament)
    operationsFn(tournamentTS)
  }

  test("has same state", () => {
    expect(tournamentTS.state).toEqual(tournament.state)
  })
  test("has same matches", () => {
    expect(tournamentTS.matches).toEqual(tournament.matches)
  })

  if (testFn) {
    testFn(tournamentTS)
  }
}

//Not working because roundrobin version is not the same
describe.skip("GroupState 10 players", () => {
  checkSameStateAndMatch([3, {}])
})
