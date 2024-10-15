import { DateType, globalTournamentPoints } from "../types/lan"
import { DuelOpts } from "./tournament/duel"
import { FFAOpts } from "./tournament/ffa"
import { GroupStageOpts } from "./tournament/groupstage"
import { Id } from "./tournament/match"
import { Result as InternalResult } from "./tournament/tournament"

export enum TournamentStatus {
	Open = "OPEN",
	Balancing = "BALANCING",
	Running = "RUNNING",
	Paused = "PAUSED",
	Validating = "VALIDATING",
	Done = "DONE",
}

export enum BracketStatus {
	Pending = "PENDING",
	Running = "RUNNING",
	Validating = "VALIDATING",
	Done = "DONE",
}

/** List of supported bracket types */
export enum BracketType {
	Duel = "Duel",
	FFA = "FFA",
	GroupStage = "Round robin",
}

/** Concatenation of all supported bracket type options */
export interface BracketSettings extends DuelOpts, FFAOpts, GroupStageOpts {
	// Used to select the players that will play in next bracket
	size?: number
	type: BracketType
}

/** Tournament not critical properties. These can be edited at any time before the tournament ends */
export interface TournamentProperties {
	name: string
	game?: number
	startTime: DateType
	globalTournamentPoints: globalTournamentPoints
	comments: string
}

/** Tournament critical settings. Can't be changed */
export interface TournamentSettings {
	useTeams: boolean
	usersCanCreateTeams?: boolean
	teamsMaxSize?: number
}

export interface Seeding {
	id: string
	seed: number
}

export type BracketResult = InternalResult & { id: string }

/** Regroups identification, status and not critical properties of a tournament */
export interface TournamentInfo extends TournamentProperties {
	id: string
	bracketsCount: number
	currentBracket: number
	status: TournamentStatus
	players: Player[]
	teams: Team[]
}

export interface Result {
	userId: string
	position: number
	globalTournamentPoints: number
	wins: number
	for?: number
	against?: number
}

export interface Team {
	name: string
	members: string[]
}

export interface Player {
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
	bracketsCount: number
	currentBracket: number
	properties: TournamentProperties
	settings: TournamentSettings
	bracketSettings: BracketSettings[]
	players: Player[]
	teams: Team[]
	matches: Match[]
	results?: Result[][]
	bracketsResults?: BracketResult[][]
}