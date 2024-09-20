import { DateType, globalTournamentPoints } from "../types/lan"
import { DuelOpts } from "./tournament/duel"
import { FFAOpts } from "./tournament/ffa"
import { GroupStageOpts } from "./tournament/groupstage"
import { Id } from "./tournament/match"

export enum TournamentStatus {
	Open = "OPEN",
	Balancing = "BALANCING",
	Running = "RUNNING",
	Paused = "PAUSED",
	Validating = "VALIDATING",
	Done = "DONE",
}

/** List of supported bracket types */
export enum BracketType {
	Duel = "DUEL",
	FFA = "FFA",
	GroupStage = "GroupStage",
}

/** Concatenation of all supported bracket type options */
export interface BracketSettings extends DuelOpts, FFAOpts, GroupStageOpts {
	type: BracketType
	useTeams: boolean
	usersCanCreateTeams?: boolean
	teamsMaxSize?: number
}

/** Tournament not critical properties. These can be edited at any time before the tournament ends */
export interface TournamentProperties {
	name: string
	game?: number
	startTime: DateType
	globalTournamentPoints: globalTournamentPoints
	comments: string
}

/** Regroups identification, status and not critical properties of a tournament */
export interface TournamentInfo extends TournamentProperties {
	id: string
	status: TournamentStatus
	players: Player[]
	teams: Team[]
}

export interface Result {
	userId: string
	position: number
	globalTournamentPoints: number
	wins: number
	for: number | undefined
	against: number | undefined
}

export interface Team {
	seed: number
	name: string
	members: string[]
}

export interface Player {
	seed: number
	userId: string
	isForfeit: boolean
	result?: number
	points?: number
}

export interface Match {
	bracket: number
	id: Id,
	opponents: (string | undefined)[]
	score: (number | undefined)[]
	scorable: boolean
	isFinale: boolean
}

export interface TournamentFullData {
	id: string
	status: TournamentStatus
	properties: TournamentProperties
	settings: BracketSettings[]
	players: Player[]
	teams: Team[]
	matches: Match[]
}