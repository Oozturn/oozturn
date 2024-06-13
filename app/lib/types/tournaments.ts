import { DateType } from "./lan"
import { ManagerStates, TournamentManagerOptions } from "../tournamentManager/tournamentManager"

export enum TournamentStatus {
    Open,
    Balancing,
    Running,
    Paused,
    Validating,
    Done,
}

export enum TournamentType {
	Duel = "DUEL",
	FFA = "FFA"
}


export interface globalTournamentPoints {
    leaders: number[]
    default: number
}

export interface TournamentSettings extends TournamentManagerOptions {
    type: TournamentType
    startTime: DateType
    useTeams: boolean
    usersCanCreateTeams?: boolean
    teamsMaxSize?: number
    globalTournamentPoints: globalTournamentPoints
}

export interface TournamentTeam {
    seed: number
    name: string
    members: string[]
}

export interface TournamentBracket {
    type: string,
    options: BracketOptions
}

export interface BracketOptions {
    last?: boolean
    short?: boolean
    lowerScoreIsBetter?: boolean
    sizes: number[]
    advancers: number[]
    limit: number
}

export interface Player {
    seed: number
    userId: string
    isForfeit: boolean
    result?: number
    points?: number
}

export interface Tournament {
    id: string,
    name: string,
    game?: number,
    status: TournamentStatus
    players: Player[]
    teams?: TournamentTeam[]
    settings: TournamentSettings
    managerStates?: ManagerStates[]
    comments: string
}

export interface TournamentInfo {
    id: string,
    name: string,
    game?: number,
    status: TournamentStatus
    players: Player[]
    comments: string
}