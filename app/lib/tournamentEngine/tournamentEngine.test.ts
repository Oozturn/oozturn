import { Id } from "./tournament/match";
import { TournamentEngine } from "./tournamentEngine";
import { BracketType, TournamentStatus } from "./types";


describe('FFA 6', () => {
    const tournamentEngine = TournamentEngine.create("id", {
        name: "test",
        startTime: { day: 0, hour: 0, min: 0 },
        comments: '',
        globalTournamentPoints: {
            default: 0,
            leaders: []
        },
    }, {
        useTeams: false
    },
        [{
            type: BracketType.FFA,
        }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 6
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()

    test('match', () => {
        const matches = tournamentEngine.getMatches()
        expect(matches).toHaveLength(1)
        const match = matches[0]
        expect(match.opponents).toEqual(['1', '2', '3', '4', '5', '6'])
    })

    scorer({ s: 1, r: 1, m: 1 }, [6, 5, 4, 3, 2, 1])

    test('result', () => {
        expect(tournamentEngine.getResults()).toMatchObject([
            ...[1, 2, 3, 4, 5, 6].map(i => { return { userId: i + "", position: i } })
        ])
        expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    })

    test("storage", () => {
        validateStorage(tournamentEngine)
    })
})

describe('Duel 4', () => {
    const tournamentEngine = TournamentEngine.create("id", {
        name: "test",
        startTime: { day: 0, hour: 0, min: 0 },
        comments: '',
        globalTournamentPoints: {
            default: 0,
            leaders: []
        },
    }, {
        useTeams: false
    },
        [{
            type: BracketType.Duel,
        }])
    const scorer = createScorer(tournamentEngine)
    const playerCount = 4
    for (let p = 1; p <= playerCount; p++) {
        tournamentEngine.addPlayer(p + "")
    }
    tournamentEngine.startTournament()
    tournamentEngine.getMatches()

    scorer({ s: 1, r: 1, m: 1 }, [1, 0]) // 1 > 4 
    scorer({ s: 1, r: 1, m: 2 }, [0, 1]) // 3 < 2

    test('final matches', () => {
        expect(tournamentEngine.getMatch({ s: 1, r: 2, m: 1 }).opponents).toEqual(['1', '2'])
        expect(tournamentEngine.getMatch({ s: 2, r: 1, m: 1 }).opponents).toEqual(['4', '3'])
    })

    scorer({ s: 1, r: 2, m: 1 }, [1, 0]) // 1 > 2
    scorer({ s: 2, r: 1, m: 1 }, [0, 1]) // 4 < 3

    test('result', () => {
        expect(tournamentEngine.getResults()).toMatchObject([
            ...[1, 2, 3, 4].map(i => { return { userId: i + "", position: i } })
        ])
        expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    })

    test("storage", () => {
        validateStorage(tournamentEngine)
    })
})

describe('GroupStage 6/3', () => {
    const tournamentEngine = TournamentEngine.create("id", {
        name: "test",
        startTime: { day: 0, hour: 0, min: 0 },
        comments: '',
        globalTournamentPoints: {
            default: 0,
            leaders: []
        },
    }, {
        useTeams: false
    },
        [{
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

    test('result', () => {
        expect(tournamentEngine.getResults()).toMatchObject([
            ...[1, 2, 3, 4, 5, 6].map(i => { return { userId: i + "", position: i - (i + 1) % 2 } })
        ])
        expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    })

    test("storage", () => {
        validateStorage(tournamentEngine)
    })
})

describe('GroupStage 4/2, lowerScoreIsBetter', () => {
    const tournamentEngine = TournamentEngine.create("id", {
        name: "test",
        startTime: { day: 0, hour: 0, min: 0 },
        comments: '',
        globalTournamentPoints: {
            default: 0,
            leaders: []
        },
    }, {
        useTeams: false
    },
        [{
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

    test('result', () => {
        expect(tournamentEngine.getResults()).toMatchObject([
            ...[1, 2, 3, 4].map(i => { return { userId: i + "", position: i - (i + 1) % 2 } })
        ])
        expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    })
})

describe('GroupStage 6/2, lowerScoreIsBetter with points draw and score break', () => {
    const tournamentEngine = TournamentEngine.create("id", {
        name: "test",
        startTime: { day: 0, hour: 0, min: 0 },
        comments: '',
        globalTournamentPoints: {
            default: 0,
            leaders: []
        },
    }, {
        useTeams: false
    },
        [{
            type: BracketType.GroupStage,
            groupSize: 3,
            lowerScoreIsBetter: true,
            scoresBreak:true
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

    test('result', () => {
        expect(tournamentEngine.getResults()).toMatchObject([
            ...[1, 2, 3, 4, 5, 6].map(i => { return { userId: i + "", position: i - (i + 1) % 2 } })
        ])
        expect(tournamentEngine.getStatus()).toBe(TournamentStatus.Done)
    })
})

describe('6 players | GS 3 | FFA top 2', () => {
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
        [{
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

    expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Running)
    expect(tournamentEngine.getResults(0)).toMatchObject([
        ...[2, 1, 4, 3, 6, 5].map(i => { return { userId: (7 - i) + "", position: i - (i + 1) % 2 } })
    ])
    validateStorage(tournamentEngine)

    scorer({ s: 1, r: 1, m: 1 }, [0, 1]) // 5 < 6

    test('result', () => {
        expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Done)
        expect(tournamentEngine.getResults()).toMatchObject([
            { userId: '6', position: 1 },
            { userId: '5', position: 2 }
        ])
    })

    test("storage", () => {
        validateStorage(tournamentEngine)
    })
});

describe('8 players | GS 4 | Duel top 4', () => {
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
        [{
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

    expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Running)
    expect(tournamentEngine.getResults(0)).toMatchObject([
        ...[2, 1, 4, 3, 6, 5, 8, 7].map(i => { return { userId: (9 - i) + "", position: i - (i + 1) % 2 } })
    ])
    validateStorage(tournamentEngine)

    scorer({ s: 1, r: 1, m: 1 }, [1, 0]) // 7 > 6
    scorer({ s: 1, r: 1, m: 2 }, [0, 1]) // 5 < 8
    scorer({ s: 1, r: 2, m: 1 }, [0, 1]) // 7 < 8
    scorer({ s: 2, r: 1, m: 1 }, [1, 0]) // 6 > 5

    test('result', () => {
        expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Done)
        expect(tournamentEngine.getResults()).toMatchObject([
            { userId: '8', position: 1 },
            { userId: '7', position: 2 },
            { userId: '6', position: 3 },
            { userId: '5', position: 4 }
        ])
    })

    test("storage", () => {
        validateStorage(tournamentEngine)
    })
});

describe('8 players | FFA 4 | Duel top 4', () => {
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
        [{
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

    expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Running)
    expect(tournamentEngine.getResults(0)).toMatchObject([
        ...[2, 1, 4, 3, 6, 5, 8, 7].map(i => { return { userId: (9 - i) + "", position: i - (i + 1) % 2 } })
    ])
    validateStorage(tournamentEngine)

    scorer({ s: 1, r: 1, m: 1 }, [1, 0]) // 7 > 6
    scorer({ s: 1, r: 1, m: 2 }, [0, 1]) // 5 < 8
    scorer({ s: 1, r: 2, m: 1 }, [0, 1]) // 7 < 8
    scorer({ s: 2, r: 1, m: 1 }, [1, 0]) // 6 > 5

    test('result', () => {
        expect(tournamentEngine.getStatus()).toEqual(TournamentStatus.Done)
        expect(tournamentEngine.getResults()).toMatchObject([
            { userId: '8', position: 1 },
            { userId: '7', position: 2 },
            { userId: '6', position: 3 },
            { userId: '5', position: 4 }
        ])
    })

    test("storage", () => {
        validateStorage(tournamentEngine)
    })
});


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

