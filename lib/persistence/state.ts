import * as fs from 'fs';
import { logger } from '../logging/logging'
import { TournamentStatus } from '../../__generated__/gql/types';
import { Id as MatchId } from '../tournament/match';

declare global {
    var diskPersistenceInterval: NodeJS.Timer
    var state: StateRoot
}

export interface StateGame {
    id: number
    name: string
    platforms: number[]
    cover: string
    picture: string
    release?: number
}

export interface StatePlayer {
    username: string
    avatar: string
    team: string
    isAdmin: boolean
    ips: string[]
}

export interface PlayerResult {
    username: string
    position: number
}

export interface BracketEvent {
    type: "score"
    id: MatchId
    score: number[]
}

export interface BracketSeed {
    nb: number
    opponent: string
}

export interface Bracket {
    type: string // 'Duel' or 'FFA'
    options: {
        last?: number
        short?: boolean
        lowerScoreIsBetter?: boolean
        sizes?: number[]
        advancers?: number[]
        limit?: number
    }
    state?: BracketEvent[]
    seeding?: BracketSeed[]
}

export interface TournamentTeam {
    name: string
    players: string[]
}

export interface DateType {
    day: number
    hour: number
    min: number
}

export interface GlobalTournamentSettings {
    leaders: number[]
    default: number
}

export interface StateTournament {
    id: string
    name: string
    game: number
    bracket: Bracket
    scoresInProgress: { [key: string]: number[] }
    status: TournamentStatus
    players: string[]
    forfeitOpponents?: string[]
    useTeams: boolean
    usersCanCreateTeams?: boolean
    teamsMaxSize?: number
    teams?: TournamentTeam[]
    startTime: DateType
    globalTournamentSettings: GlobalTournamentSettings
    comments: string
    results?: PlayerResult[]
}

export interface StateLan {
    name: string
    motd: string
    defaultTournamentSettings: GlobalTournamentSettings
    weightTeamsResults: boolean
    partialResults: boolean
    startDate: DateType
    endDate: DateType
}

export interface StateRoot {
    players: StatePlayer[]
    lan: StateLan
    tournaments: StateTournament[]
    games: StateGame[]
}

export async function doTransaction<T>(operations: (state :StateRoot) => T) {
    let copy = JSON.parse(JSON.stringify(global.state))
    let returnValue = await operations(copy)
    global.state = copy
    return returnValue
}

export function getStateReadOnly() : StateRoot {
    return global.state
}

const stateDbFileName = 'stateDB.json'
const intervalPersistenceSeconds = 10

initialiseDiskPersistence()
restoreState()

function initialiseDiskPersistence() {
    if (global.diskPersistenceInterval) {
        return
    }
    logger.info("Initialisation persistence interval")
    global.diskPersistenceInterval = setInterval(storeState, intervalPersistenceSeconds * 1000)
}

function storeState() {
    logger.info("Persisting state")
    fs.writeFileSync(stateDbFileName, JSON.stringify(global.state, null, 2), 'utf-8')
}

function restoreState() {
    if(global.state) {
        return;
    }

    if (fs.existsSync(stateDbFileName)) {
        logger.info("Restoring state from file")
        global.state = JSON.parse(fs.readFileSync(stateDbFileName, 'utf-8'))
    } else {
        logger.info("Initialise state with default")
        global.state = {
            players: [],
            lan: {
                name: "OOZ-LAN",
                motd: "Hello !",
                defaultTournamentSettings: {leaders: [10, 6, 4, 2], default: 1},
                weightTeamsResults: false,
                partialResults: false,
                startDate: {day:5, hour: 18, min: 0},
                endDate: {day: 0, hour: 14, min: 0}
            },
            tournaments: [],
            games: []
        }
    }
}