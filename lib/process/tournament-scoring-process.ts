import { GraphQLError } from "graphql";
import { IdInput, Match, TournamentStatus } from "../../__generated__/gql/types";
import { Bracket, StateRoot, StateTournament, doTransaction } from "../persistence/state";
import { Duel } from "../tournament/duel";
import { FFA } from "../tournament/ffa";
import { Logger } from "pino";
import { IronSession } from "iron-session";
import { getTournament } from "./access-object-process";

export async function setScore(tournamentId: string, matchId: IdInput, player: number, score: number, logger: Logger, session: IronSession) {
    // returns true if score have been directly applied to the match (in case of an already done match), else false
    return await doTransaction(state => {

        const tournament = getTournament(tournamentId, state)
        const bracket = getBracket(tournament)
        const match = bracket.findMatch(matchId)

        logger.info(`Scoring ${tournamentId}: ${match.id} ${player} ${score}`)

        if (match.m) {
            // match done => update it
            const scoreArray = match.m.slice()
            scoreArray[match.p.findIndex(it => it === player)] = score
            return applyScore(tournament, bracket, match.id, scoreArray, logger, session)
        }
        
        // match not done yet => add score to scoreInProgress
        let scoreInProgressKey = JSON.stringify(match.id)
        let scoreInProgress = tournament.scoresInProgress[scoreInProgressKey] || Array(match.p.length).fill(undefined)
        scoreInProgress[match.p.findIndex(it => it === player)] = score
        tournament.scoresInProgress[scoreInProgressKey] = scoreInProgress
        
        return false
    })
}

function getffScore(sip: number[], invert: boolean) {
    const scores = sip.map(it => it != undefined ? it : 1)
    if (invert) {
        return Math.max(...scores) + 1
    } else {
        return Math.min(...scores) - 1
    }
}

function getMatchFullScoreArray(tournament: StateTournament, match: Match, partialScoreArray: number[]) {
    const matchPlayersState = getMatchPlayersState(tournament, match)
    // If match is not ready to finish, abort
    if(!matchPlayersState.every(it => it != 0)) {
        if(tournament.bracket.type == 'FFA') {
            return null
        } else if (matchPlayersState.filter(it => it == 2).length < 1) {
            return null
        }
    }

    let scoreArray: number[] = Array(match.p.length)
    if (matchPlayersState.every(it => it == 1)) {
        // Every opponent has a score => Besoin de check si (it != undefined) ??
        scoreArray = partialScoreArray.map(it => it != undefined ? it : getffScore(partialScoreArray, tournament.bracket.options.lowerScoreIsBetter == true))
    }
    else {
        if (matchPlayersState.filter(it => it == 1).length > 0) {
            // one player scored and the second ff
            matchPlayersState.forEach((it, index) => {it == 1 && (scoreArray[index] = partialScoreArray[index])})
        } else {
            // one player ff before the other score
            matchPlayersState.forEach((it, index) => {it != 2 && (scoreArray[index] = 1)})
        }
        matchPlayersState.forEach((it, index) => {
            if (it == 2) {
                scoreArray[index] = getffScore(partialScoreArray, tournament.bracket.options.lowerScoreIsBetter == true)
            }
        })
    }
    return scoreArray
}

export function ResolveMatch(tournamentId: string, matchId: IdInput, logger: Logger, session: IronSession) {
    doTransaction(state => {
        
        const tournament = getTournament(tournamentId, state)
        const bracket = getBracket(tournament)
        
        function _ResolveMatch(_matchId: IdInput) {
            const match = bracket.findMatch(_matchId)
            const scoreInProgressKey = JSON.stringify(match.id)
            const scoreInProgress = tournament.scoresInProgress[scoreInProgressKey] || Array(match.p.length).fill(undefined)
            
            const matchPlayersMask = getMatchPlayersState(tournament, match)
            if(!matchPlayersMask.every(it => [1, 2].includes(it))) {
                if(tournament.bracket.type == 'FFA') {
                    return
                } else if (matchPlayersMask.filter(it => it == 2).length < 1) {
                    return
                }
            }
    
            if (applyScore(tournament, bracket, match.id, scoreInProgress, logger, session)) {
                delete tournament.scoresInProgress[scoreInProgressKey]
            }

            if (bracket instanceof Duel) {
                // check if next matchs are done (possible because of forfeit)
                const rightMatch = bracket.right(_matchId)
                rightMatch && _ResolveMatch(rightMatch[0])
                const downMatch = bracket.down(_matchId)
                downMatch && _ResolveMatch(downMatch[0])
            }
            if (bracket instanceof FFA) {
                // check if next round is defined then if some of its matches are done
                if (bracket.rounds(matchId.s).length > matchId.r && matchReadyToBeScored(bracket.findMatch({s: matchId.s, r: matchId.r+1, m: 1}))) {
                    bracket.findMatches({s: matchId.s, r: matchId.r + 1}).forEach(match => _ResolveMatch(match.id))
                }
            }
        }
        _ResolveMatch(matchId)

    })
}

export function applyScore(tournament: StateTournament, bracket: Duel | FFA, matchId: IdInput, partialScoreArray: number[], logger: Logger, session: IronSession) {
    
    // update scoreArray by removing ff scores and set it following the resolveMatch algorythm.
    // So no need to keep these replacements and checks in other places, so scoreArray can contain undefined/null content
    const scoreArray = getMatchFullScoreArray(tournament, bracket.findMatch(matchId), partialScoreArray)
    if (!scoreArray) return false
    
    const unscorableReason = bracket.unscorable(matchId, scoreArray, session.user?.isAdmin ? true : false)
        if (unscorableReason) {
        logger.error(`Error trying to score: "${unscorableReason}"`)
        return false
    }
    bracket.score(matchId, scoreArray)
    if (!tournament.bracket.state) {
        tournament.bracket.state = []
    }
    tournament.bracket.state.push({ type: "score", id: matchId, score: scoreArray })

    
    // Check if the tournament is done
    if (bracket.isDone()) {
        logger.info(`Tournament "${tournament.id}" just finished, admin has to verify the scores`)
        tournament.status = TournamentStatus.Validating
    }
    return true
}

export async function terminateTournament(tournamentId: string, logger: Logger, session: IronSession) {
    return await doTransaction(state => {
        const tournament = getTournament(tournamentId, state)
        const bracket = getBracket(tournament)
        // Check if the tournament is done
        const isDone = bracket.isDone()
        if (isDone) {
            tournament.status = TournamentStatus.Done
            // TODO: set winners and their points
            tournament.results = []
            bracket.results().map(res => {
                let opponent = tournament!!.bracket.seeding?.find(seed => seed.nb == res.seed)?.opponent
                if (opponent) {
                    if (tournament!!.useTeams) {
                        let team = tournament?.teams?.find(team => team.name == opponent)
                        if (team) {
                            team.players.map(playername => tournament!!.results?.push({ username: playername, position: res.pos }))
                        }
                    }
                    else {
                        tournament!!.results?.push({ username: opponent, position: res.pos })
                    }
                }
            })
            return true
        }
        return false
    })
}

/** returns a mask of match players state :
 *     - 0: no information for this player
 *     - 1: player has scored
 *     - 2: player has ff
 **/
export function getMatchPlayersState(tournament: StateTournament, match: Match) {
    const scoreInProgress = tournament.scoresInProgress[JSON.stringify(match.id)] || Array(match.p.length).fill(undefined)
    const ffIDList = tournament.forfeitOpponents?.map(ffo => tournament.bracket.seeding?.find(seed => seed.opponent == ffo)?.nb)
    const matchPlayersState = match.p.map((opponentID, index) => {
        if (scoreInProgress[index] != undefined && scoreInProgress[index] != null) return 1
        else {
            if (ffIDList?.includes(opponentID)) return 2
        }
        return match.m ? 1 : 0
    })
    return matchPlayersState
}

function hasDupplicatedScores(array: any[]) {
    return (new Set(array).size != array.length)
}

export function isAmbiguousScore(state: StateRoot, tournamentId: string, matchId: IdInput, player: number, score: number): boolean {
    let tournament = getTournament(tournamentId, state)
    let bracket = getBracket(tournament)
    let match = bracket.findMatch(matchId)

    let partialScoreArray : number[] = match.m || tournament.scoresInProgress[JSON.stringify(matchId)] || Array(match.p.length).fill(undefined)
    partialScoreArray[match.p.findIndex(it => it === player)] = score

    const scoreArray = getMatchFullScoreArray(tournament, bracket.findMatch(matchId), partialScoreArray)
    if (!scoreArray) return false

    // Check for equalities
    if (bracket instanceof FFA) {
        if (matchId.r == tournament.bracket.options.sizes?.length) {
            // last round
            if(hasDupplicatedScores(scoreArray.slice(0, 5))) {
                return true
            }
        } else {
            const matchAdvancers = tournament.bracket.options.advancers ? tournament.bracket.options.advancers[matchId.r-1] : 1
            if ((tournament.useTeams ? tournament.teams?.length || 0 : tournament.players.length) <= matchAdvancers) {
                return false
            }
            if (scoreArray[matchAdvancers-1] == scoreArray[matchAdvancers]){
                return true
            }
        }
    }
    if (bracket instanceof Duel) {
        if (scoreArray[0] == scoreArray[1]) {
            return true
        }
    }

    return false
}

export function userCanSetScore(state: StateRoot, username: string, tournamentId: string, matchId: IdInput, player: number): boolean {
    let tournament = getTournament(tournamentId, state)
    let bracket = getBracket(tournament)
    let match = bracket.findMatch(matchId)

    return matchReadyToBeScored(match) && userIsPlayer(username, tournament, player)
}

export function getBracket(tournament: StateTournament): Duel | FFA {
    let bracket = getBracketfromStorage(tournament.bracket)
    if (!bracket) {
        throw new GraphQLError(`Error retrieving bracket for tournament "${tournament.id}"`)
    }
    return bracket
}

export function getBracketfromStorage(storedBracket: Bracket): Duel | FFA | undefined {
    if (storedBracket.seeding) {
        let b: Duel | FFA
        if ("Duel" == storedBracket.type) {
            b = Duel.restore(storedBracket.seeding.length, { lowerScoreIsBetter: storedBracket.options.lowerScoreIsBetter, last: storedBracket.options.last, short: storedBracket.options.short }, storedBracket.state || [])
        } else {
            b = FFA.restore(storedBracket.seeding.length, { lowerScoreIsBetter: storedBracket.options.lowerScoreIsBetter, advancers: storedBracket.options.advancers, sizes: storedBracket.options.sizes, limit: storedBracket.options.limit }, storedBracket.state || [])
        }
        return b
    }
}

function matchReadyToBeScored(match: Match) {
    // All players are defined so previous matches scores are filled
    return match.p.every(player => player > 0)
}

function userIsPlayer(username: string, tournament: StateTournament, player: number) {
    const opponent = tournament.bracket.seeding?.find(seed => seed.nb == player)?.opponent
    if (!opponent) return false
    if (tournament.useTeams && tournament.teams?.find(team => team.name == opponent)?.players.includes(username)) return true
    return opponent === username
}