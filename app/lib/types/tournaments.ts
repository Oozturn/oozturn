import { DateType } from "./lan"

export enum TournamentStatus {
    Open,
    Balancing,
    Running,
    Paused,
    Done,
    Validating
}

export enum TournamentType {
    Duel = "DUEL",
    FFA = "FFA"
}

export interface globalTournamentSettings {
    leaders: number[]
    default: number
}

export interface TournamentSettings {
    type: TournamentType
    startTime: DateType
    useTeams: boolean
    playersCanCreateTeams?: boolean
    teamsMaxSize?: number
    invertedScore: boolean
    globalTournamentSettings: globalTournamentSettings
}

export interface TournamentTeam {
    name: string
    members: string[]
}

export interface TournamentBracket {
    type:string,
    options:BracketOptions
}

export interface BracketOptions {
    last?: number
    short?: boolean
    lowerScoreIsBetter?: boolean
    sizes: number[]
    advancers: number[]
    limit: number
}

export interface Player {
    seed: number
    playername: string
    isForfeit: boolean
    result?: number
    points?: number
}

export interface Tournament {
    id: string,
    name: string,
    game: number,
    status: TournamentStatus
    players: Player[]
    teams?: TournamentTeam[]
    settings: TournamentSettings
    bracket: TournamentBracket
    comments: string
}

export interface TournamentInfo {
    id: string,
    name: string,
    game: number,
    status: TournamentStatus
    players: Player[]
    comments: string
}