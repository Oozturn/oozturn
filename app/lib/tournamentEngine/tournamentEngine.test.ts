import { Id } from "./tournament/match";
import { TournamentEngine } from "./tournamentEngine";
import { BracketSettings, BracketType, TournamentStatus } from "./types";


test('FFA 6', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.FFA,
    }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 6
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()

    const matches = tournamentEngine.getMatches()
    expect(matches).toHaveLength(1)
    const match = matches[0]
    expect(match.opponents).toEqual(['1', '2', '3', '4', '5', '6'])

    scorer({ s: 1, r: 1, m: 1 }, [6, 5, 4, 3, 2, 1])
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3, 4, 5, 6].map(i => { return { userId: i + "", position: i } })
    ])
    expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    validateStorage(tournamentEngine)
})

test('FFA 3 with forfeit last', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.FFA,
    }])
    const playerCount = 3
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()
    tournamentEngine.score({ s: 1, r: 1, m: 1 }, "1", 6)
    tournamentEngine.score({ s: 1, r: 1, m: 1 }, "2", 5)
    tournamentEngine.toggleForfeitPlayer("3")
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3].map(i => { return { userId: i + "", position: i } })
    ])
    expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    validateStorage(tournamentEngine)
})

test('FFA 3 with forfeit last lowerScoreIsBetter', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.FFA,
        lowerScoreIsBetter: true
    }])
    const playerCount = 3
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()
    tournamentEngine.score({ s: 1, r: 1, m: 1 }, "1", 5)
    tournamentEngine.score({ s: 1, r: 1, m: 1 }, "2", 6)
    tournamentEngine.toggleForfeitPlayer("3")
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3].map(i => { return { userId: i + "", position: i } })
    ])
    expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    validateStorage(tournamentEngine)
})

test('FFA 3 with forfeit first', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.FFA,
    }])
    const playerCount = 3
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()
    tournamentEngine.toggleForfeitPlayer("3")
    tournamentEngine.score({ s: 1, r: 1, m: 1 }, "1", 6)
    tournamentEngine.score({ s: 1, r: 1, m: 1 }, "2", 5)
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3].map(i => { return { userId: i + "", position: i } })
    ])
    validateStorage(tournamentEngine)
})

test('Duel 4', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.Duel,
    }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 4
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()
    scorer({ s: 1, r: 1, m: 1 }, [1, 0]) // 1 > 4 
    scorer({ s: 1, r: 1, m: 2 }, [0, 1]) // 3 < 2

    expect(tournamentEngine.getMatch({ s: 1, r: 2, m: 1 }).opponents).toEqual(['1', '2'])
    expect(tournamentEngine.getMatch({ s: 2, r: 1, m: 1 }).opponents).toEqual(['4', '3'])

    scorer({ s: 1, r: 2, m: 1 }, [1, 0]) // 1 > 2
    scorer({ s: 2, r: 1, m: 1 }, [0, 1]) // 4 < 3
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3, 4].map(i => { return { userId: i + "", position: i } })
    ])
    expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    validateStorage(tournamentEngine)
})

test('Duel 3 (match with undefined) short', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.Duel,
        short: true
    }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 3
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()
    scorer({ s: 1, r: 1, m: 2 }, [0, 1]) // 3 < 2

    expect(tournamentEngine.getMatch({ s: 1, r: 2, m: 1 }).opponents).toEqual(['1', '2'])

    scorer({ s: 1, r: 2, m: 1 }, [1, 0]) // 1 > 2
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3].map(i => { return { userId: i + "", position: i } })
    ])
    expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    validateStorage(tournamentEngine)
})

test('Duel 4 wih forfeit : terminate all match', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.Duel,
    }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 4
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()
    scorer({ s: 1, r: 1, m: 2 }, [0, 1]) // 3 < 2
    tournamentEngine.toggleForfeitPlayer('4')

    expect(tournamentEngine.getMatch({ s: 1, r: 2, m: 1 }).opponents).toEqual(['1', '2'])
    expect(tournamentEngine.getMatch({ s: 2, r: 1, m: 1 }).opponents).toEqual(['4', '3'])

    scorer({ s: 1, r: 2, m: 1 }, [1, 0]) // 1 > 2
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3, 4].map(i => { return { userId: i + "", position: i } })
    ])
    expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    validateStorage(tournamentEngine)
})

test('Duel 4 wih forfeit : can re-enter', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.Duel,
    }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 4
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()
    tournamentEngine.toggleForfeitPlayer('4') //Lose first match, go to lower bracket
    tournamentEngine.toggleForfeitPlayer('4')

    scorer({ s: 1, r: 1, m: 2 }, [0, 1]) // 3 < 2

    expect(tournamentEngine.getMatch({ s: 1, r: 2, m: 1 }).opponents).toEqual(['1', '2'])
    expect(tournamentEngine.getMatch({ s: 2, r: 1, m: 1 }).opponents).toEqual(['4', '3'])

    scorer({ s: 1, r: 2, m: 1 }, [1, 0]) // 1 > 2
    scorer({ s: 2, r: 1, m: 1 }, [0, 1]) // 4 < 3
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3, 4].map(i => { return { userId: i + "", position: i } })
    ])
    expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    validateStorage(tournamentEngine)
})

test('Duel 4 lowerScoreIsBetter wih forfeit : terminate all match', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.Duel,
        lowerScoreIsBetter: true
    }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 4
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()
    scorer({ s: 1, r: 1, m: 2 }, [1, 0]) // 3 < 2
    tournamentEngine.toggleForfeitPlayer('4')

    expect(tournamentEngine.getMatch({ s: 1, r: 2, m: 1 }).opponents).toEqual(['1', '2'])
    expect(tournamentEngine.getMatch({ s: 2, r: 1, m: 1 }).opponents).toEqual(['4', '3'])

    scorer({ s: 1, r: 2, m: 1 }, [0, 1]) // 1 > 2
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3, 4].map(i => { return { userId: i + "", position: i } })
    ])
    expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    validateStorage(tournamentEngine)
})

test('GroupStage 6/3', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.GroupStage,
        groupSize: 3
    }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 6
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()
    scorer({ s: 1, r: 1, m: 1 }, [1, 0]) // 3 > 6 
    scorer({ s: 1, r: 2, m: 1 }, [0, 1]) // 6 < 1
    scorer({ s: 1, r: 3, m: 1 }, [1, 0]) // 1 > 3
    scorer({ s: 2, r: 1, m: 1 }, [1, 0]) // 4 > 5
    scorer({ s: 2, r: 2, m: 1 }, [0, 1]) // 5 < 2
    scorer({ s: 2, r: 3, m: 1 }, [1, 0]) // 2 > 4
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3, 4, 5, 6].map(i => { return { userId: i + "", position: i - (i + 1) % 2 } })
    ])
    expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    validateStorage(tournamentEngine)
})

test('GroupStage 6/3 with forfeit early', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.GroupStage,
        groupSize: 3
    }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 6
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()
    tournamentEngine.toggleForfeitPlayer("6")
    scorer({ s: 1, r: 3, m: 1 }, [1, 0]) // 1 > 3
    scorer({ s: 2, r: 1, m: 1 }, [1, 0]) // 4 > 5
    scorer({ s: 2, r: 2, m: 1 }, [0, 1]) // 5 < 2
    scorer({ s: 2, r: 3, m: 1 }, [1, 0]) // 2 > 4
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3, 4, 5, 6].map(i => { return { userId: i + "", position: i - (i + 1) % 2 } })
    ])
    expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    validateStorage(tournamentEngine)
})

test('GroupStage 6/3 with forfeit late', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.GroupStage,
        groupSize: 3
    }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 6
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()
    scorer({ s: 1, r: 3, m: 1 }, [1, 0]) // 1 > 3
    scorer({ s: 2, r: 1, m: 1 }, [1, 0]) // 4 > 5
    scorer({ s: 2, r: 2, m: 1 }, [0, 1]) // 5 < 2
    scorer({ s: 2, r: 3, m: 1 }, [1, 0]) // 2 > 4
    tournamentEngine.toggleForfeitPlayer("6")
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3, 4, 5, 6].map(i => { return { userId: i + "", position: i - (i + 1) % 2 } })
    ])
    expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    validateStorage(tournamentEngine)
})

test('GroupStage 4/2, lowerScoreIsBetter', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.GroupStage,
        groupSize: 2,
        lowerScoreIsBetter: true
    }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 4
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()

    scorer({ s: 1, r: 1, m: 1 }, [0, 1]) // 1 > 4
    scorer({ s: 2, r: 1, m: 1 }, [0, 1]) // 2 > 3
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3, 4].map(i => { return { userId: i + "", position: i - (i + 1) % 2 } })
    ])
    expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    validateStorage(tournamentEngine)
})

test('GroupStage 6/2, lowerScoreIsBetter with points draw and score break', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.GroupStage,
        groupSize: 3,
        lowerScoreIsBetter: true,
        scoresBreak: true
    }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 6
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()
    scorer({ s: 1, r: 1, m: 1 }, [2, 0]) // 3 << 6 
    scorer({ s: 1, r: 2, m: 1 }, [4, 0]) // 6 <<< 1
    scorer({ s: 1, r: 3, m: 1 }, [1, 0]) // 1 < 3
    scorer({ s: 2, r: 1, m: 1 }, [2, 0]) // 4 << 5
    scorer({ s: 2, r: 2, m: 1 }, [4, 0]) // 5 <<< 2
    scorer({ s: 2, r: 3, m: 1 }, [1, 0]) // 2 < 4
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3, 4, 5, 6].map(i => { return { userId: i + "", position: i - (i + 1) % 2 } })
    ])
    expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    validateStorage(tournamentEngine)
})

test('6 players | GS 3 | FFA top 2', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.GroupStage,
        groupSize: 3
    }, {
        type: BracketType.FFA,
        size: 2
    }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 6
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()
    scorer({ s: 1, r: 1, m: 1 }, [0, 1]) // 3 < 6 
    scorer({ s: 1, r: 2, m: 1 }, [1, 0]) // 6 > 1
    scorer({ s: 1, r: 3, m: 1 }, [0, 1]) // 1 < 3
    scorer({ s: 2, r: 1, m: 1 }, [0, 1]) // 4 < 5
    scorer({ s: 2, r: 2, m: 1 }, [1, 0]) // 5 > 2
    scorer({ s: 2, r: 3, m: 1 }, [0, 1]) // 2 < 4
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Running)
    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 4, 3, 6, 5].map(i => { return { userId: (7 - i) + "", position: Math.max(2, i - (i + 1) % 2) } })
    ])
    validateStorage(tournamentEngine)

    scorer({ s: 1, r: 1, m: 1 }, [1, 0]) // 6 < 5
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Done)
    expect(tournamentEngine.getResults()).toMatchObject([
        { userId: '6', position: 1 },
        { userId: '5', position: 2 },
        { userId: '3', position: 3 },
        { userId: '4', position: 3 },
        { userId: '1', position: 5 },
        { userId: '2', position: 5 }
    ])
    validateStorage(tournamentEngine)
});

test('8 players | GS 4 | Duel top 4', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.GroupStage,
        groupSize: 4
    }, {
        type: BracketType.Duel,
        size: 4
    }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 8
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()
    tournamentEngine.getMatches().forEach(match => {
        if (match.opponents[0]! > match.opponents[1]!) {
            scorer(match.id, [1, 0])
        } else {
            scorer(match.id, [0, 1])
        }
    })
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Running)
    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3, 4, 6, 5, 8, 7].map(i => { return { userId: (9 - i) + "", position: Math.max(4, i - (i + 1) % 2) } })
    ])
    validateStorage(tournamentEngine)

    scorer({ s: 1, r: 1, m: 1 }, [1, 0]) // 8 > 5
    scorer({ s: 1, r: 1, m: 2 }, [0, 1]) // 6 < 7
    scorer({ s: 1, r: 2, m: 1 }, [1, 0]) // 8 > 7
    scorer({ s: 2, r: 1, m: 1 }, [0, 1]) // 5 < 6
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Done)
    expect(tournamentEngine.getResults()).toMatchObject([
        { userId: '8', position: 1 },
        { userId: '7', position: 2 },
        { userId: '6', position: 3 },
        { userId: '5', position: 4 },
        { userId: '3', position: 5 },
        { userId: '4', position: 5 },
        { userId: '1', position: 7 },
        { userId: '2', position: 7 }
    ])
    validateStorage(tournamentEngine)
});

test('8 players | FFA 4 | Duel top 4', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.FFA,
        sizes: [4]
    }, {
        type: BracketType.Duel,
        size: 4
    }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 8
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }

    tournamentEngine.startTournament()
    scorer({ s: 1, r: 1, m: 1 }, [0, 1, 2, 3]) // 1 < 3 < 6 < 8
    scorer({ s: 1, r: 1, m: 2 }, [0, 1, 2, 3]) // 2 < 4 < 5 < 7
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Running)
    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3, 4, 6, 5, 8, 7].map(i => { return { userId: (9 - i) + "", position: Math.max(4, i - (i + 1) % 2) } })
    ])
    validateStorage(tournamentEngine)

    scorer({ s: 1, r: 1, m: 1 }, [1, 0]) // 8 > 5
    scorer({ s: 1, r: 1, m: 2 }, [0, 1]) // 6 < 7
    scorer({ s: 1, r: 2, m: 1 }, [1, 0]) // 8 > 7
    scorer({ s: 2, r: 1, m: 1 }, [0, 1]) // 5 < 6
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Done)
    expect(tournamentEngine.getResults()).toMatchObject([
        { userId: '8', position: 1 },
        { userId: '7', position: 2 },
        { userId: '6', position: 3 },
        { userId: '5', position: 4 },
        { userId: '3', position: 5 },
        { userId: '4', position: 5 },
        { userId: '1', position: 7 },
        { userId: '2', position: 7 }
    ])
    validateStorage(tournamentEngine)
});

test('Tournament reset will clear brackets', () => {
    const tournamentEngine = createDefaultTournament([{
        type: BracketType.FFA,
        sizes: [4]
    }, {
        type: BracketType.Duel,
        size: 4
    }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 8
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }

    tournamentEngine.startTournament()
    scorer({ s: 1, r: 1, m: 1 }, [0, 1, 2, 3]) // 1 < 3 < 6 < 8
    scorer({ s: 1, r: 1, m: 2 }, [0, 1, 2, 3]) // 2 < 4 < 5 < 7
    tournamentEngine.validateActiveBracket()

    expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Running)
    expect(tournamentEngine.getResults()).toMatchObject([
        ...[1, 2, 3, 4, 6, 5, 8, 7].map(i => { return { userId: (9 - i) + "", position: Math.max(4, i - (i + 1) % 2) } })
    ])
    validateStorage(tournamentEngine)

    scorer({ s: 1, r: 1, m: 1 }, [1, 0]) // 7 > 6
    //more score needed to finish

    expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Running)

    tournamentEngine.stopTournament()

    expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Open)
    expect(tournamentEngine.getFullData().currentBracket).toBe(1)
    expect(tournamentEngine.getResults().some(result => result.position == 8)).toEqual(false)

    tournamentEngine.startTournament()

    expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Running)
    expect(tournamentEngine.getFullData().currentBracket).toBe(0)
    expect(tournamentEngine.getResults().every(result => result.position == 8)).toEqual(true)
    expect(tournamentEngine.getMatches().flatMap(match => match.score).every(score => score == undefined)).toEqual(true)

    validateStorage(tournamentEngine)
});

function createDefaultTournament(bracketSettings: BracketSettings[]) {
    const tournamentEngine = TournamentEngine.create("id", {
        name: "test",
        startTime: { day: 0, hour: 0, min: 0 },
        comments: '',
        globalTournamentPoints: {
            default: 0,
            leaders: []
        },
    },
        {
            useTeams: false
        },
        bracketSettings)

    return tournamentEngine
}

function validateStorage(tournament: TournamentEngine) {
    const storage = tournament.getStorage()
    const tournamentRestored = TournamentEngine.fromStorage(storage)

    expect(tournament.getMatches()).toEqual(tournamentRestored.getMatches())
    expect(tournament.getResults()).toEqual(tournamentRestored.getResults())

}

function createScorer(tournament: TournamentEngine) {
    return function score(id: Id, score: number[]) {
        const match = tournament.getMatch(id)
        if (score.length != match.opponents.length) {
            throw new Error("Number of opponents and scores do not match")
        }
        for (let i = 0; i < score.length; i++) {
            tournament.score(match.id, match.opponents[i]!, score[i])
        }
    }
}

