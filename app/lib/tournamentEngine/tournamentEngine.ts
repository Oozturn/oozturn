import { Duel } from "./tournament/duel"
import { FFA } from "./tournament/ffa"
import { Id, Match } from "./tournament/match";
import { Result } from "./tournament/tournament"
import { BracketSettings, BracketType, Player, Team, TournamentFullData, TournamentInfo, TournamentProperties, TournamentStatus } from "./types";

/** States used to save brackets progression */
interface BracketState {
	bracket: number
	id: Id
	score: (number | undefined)[]
}
export interface TournamentStorage {
	info: TournamentInfo
	settings: BracketSettings[]
	states: BracketState[]
}

interface TournamentSpecification {
	getId(): string
	getProperties(): TournamentProperties
	getInfo(): TournamentInfo
	getSettings(bracket?: number): BracketSettings
	getFullData(): TournamentFullData

	updateProperties(partialPropertiess: Partial<TournamentProperties>): void
	updateSettings(partialSettings: Partial<BracketSettings>, bracket?: number): void

	getPlayers(): Player[]
	addPlayer(userId: string): void
	removePlayer(userId: string): void
	reorderPlayers(oldIndex: number, newIndex: number): void

	getTeams(): Team[]
	addTeam(teamName: string): void
	removeTeam(teamName: string): void
	renameTeam(teamName: string, newTeamName: string): void
	addPlayerToTeam(teamName: string, userId: string): void
	removePlayerFromTeams(userId: string): void
	reorderTeams(oldIndex: number, newIndex: number): void

	getStatus(): TournamentStatus
	toggleBalanceTournament(): void
	startTournament(): void
	togglePauseTournament(): void
	stopTournament(): void

	score(matchId: Id, score: (number | undefined)[], bracket?: number): void

	getMatches(bracket?: number): Match[]
	getMatch(id: Id, bracket?: number): Match
	getResults(): Result[]
}

export class TournamentEngine implements TournamentSpecification {

	private id: string
	private status: TournamentStatus
	private properties: TournamentProperties

	private players: Player[]
	private teams: Team[]

	private settings: BracketSettings[]
	private brackets: (Duel | FFA)[] = []
	private bracketsStates: BracketState[]

	constructor(
		id: string,
		properties: TournamentProperties,
		settings: BracketSettings[],
		status?: TournamentStatus,
		players?: Player[],
		teams?: Team[],
		bracketsStates?: BracketState[]
	) {
		this.id = id
		this.status = status || TournamentStatus.Open
		this.properties = properties
		this.settings = settings
		this.players = players || []
		this.teams = teams || []
		this.bracketsStates = bracketsStates || []
		if (this.status >= TournamentStatus.Running)
			this.startTournament()
	}
	public getStorage(): TournamentStorage {
		return {
			info: this.getInfo(),
			settings: this.brackets.map((b, i) => this.getSettings(i)),
			states: this.bracketsStates
		}
	}
	public static fromStorage(tournamentStorage: TournamentStorage): TournamentEngine {
		return new TournamentEngine(
			tournamentStorage.info.id,
			tournamentStorage.info,
			tournamentStorage.settings,
			tournamentStorage.info.status,
			tournamentStorage.info.players,
			tournamentStorage.info.teams,
			tournamentStorage.states
		)
	}

	private reSeedOpponents(opponents: Team[] | Player[]): void {
		opponents.forEach((opponent, index) => opponent.seed = index)
	}
	private applyState(state: BracketState): void {
		if (state.score.some(value => value === undefined))
			throw new Error(`Tried to apply an incomplete state: ${state}`)
		this.brackets[state.bracket].score(state.id, state.score as number[])
	}

	public getId(): string {
		return this.id
	}
	public getProperties(): TournamentProperties {
		return this.properties
	}
	public getInfo(): TournamentInfo {
		return {
			id: this.id,
			status: this.status,
			players: this.players,
			teams: this.teams,
			...this.properties
		}
	}
	public getSettings(bracket?: number): BracketSettings {
		return this.settings[bracket || 0]
	}
	public getFullData(): TournamentFullData {
		return {
			id: this.id,
			status: this.status,
			properties: this.properties,
			settings: this.settings,
			players: this.players,
			teams: this.teams,
			matches: this.getMatches()
		}
	}

	public updateProperties(partialPropertiess: Partial<TournamentProperties>): void {
		this.properties = { ...this.properties, ...partialPropertiess }
	}
	public updateSettings(partialSettings: Partial<BracketSettings>, bracket?: number): void {
		this.settings[bracket || 0] = { ...this.settings[bracket || 0], ...partialSettings }
	}

	public getPlayers(): Player[] {
		return this.players
	}
	public addPlayer(userId: string): void {
		if (this.players.find(player => player.userId == userId))
			throw new Error(`Player ${userId} already in tournament ${this.id}`)
		this.players.push({ seed: this.players.length, userId: userId, isForfeit: false })
	}
	public removePlayer(userId: string): void {
		const index = this.players.findIndex(player => player.userId == userId)
		if (index == -1)
			throw new Error(`Player ${userId} not found in tournament ${this.id}`)
		this.players.splice(index, 1)
		const team = this.teams.find(team => team.members.includes(userId))
		if (team)
			team.members.splice(team.members.findIndex(m => m == userId), 1)
		this.reSeedOpponents(this.players)
	}
	public reorderPlayers(oldIndex: number, newIndex: number): void {
		if (this.players.length <= oldIndex || this.players.length <= newIndex || oldIndex < 0 || newIndex < 0 || oldIndex == newIndex) {
			throw new Error(`Invalid indexes (${oldIndex}, ${newIndex}`)
		}
		const player = this.players.splice(oldIndex, 1)[0]
		this.players.splice(newIndex, 0, player)
		this.reSeedOpponents(this.players)
	}

	public getTeams(): Team[] {
		return this.teams
	}
	public addTeam(teamName: string): void {
		if (this.teams.find(team => team.name == teamName))
			throw new Error(`Team ${teamName} already exists in tournament ${this.id}`)
		this.teams.push({ seed: this.teams.length, name: teamName, members: [] })
	}
	public removeTeam(teamName: string): void {
		const index = this.teams.findIndex(team => team.name == teamName)
		if (index == -1)
			throw new Error(`Team ${teamName} not found in tournament ${this.id}`)
		this.teams.splice(index, 1)
		this.reSeedOpponents(this.teams)
	}
	public renameTeam(teamName: string, newTeamName: string): void {
		const team = this.teams.find(team => team.name == teamName)
		if (!team)
			throw new Error(`Team ${teamName} not found in tournament ${this.id}`)
		team.name = newTeamName
	}
	public addPlayerToTeam(teamName: string, userId: string): void {
		if (!this.players.find(player => player.userId == userId))
			throw new Error(`Player ${userId} not found in tournament ${this.id}`)
		const team = this.teams.find(team => team.name == teamName)
		if (!team)
			throw new Error(`Team ${teamName} not found in tournament ${this.id}`)
		this.removePlayerFromTeams(userId)
		if (team.members.includes(userId))
			throw new Error(`Player ${userId} already in team ${team.name} (tournament ${this.id})`)
		team.members.push(userId)
	}
	public removePlayerFromTeams(userId: string): void {
		this.teams?.forEach(team => {
			const index = team.members.findIndex(member => member == userId)
			if (index != -1) team.members.splice(index, 1)
		})
	}
	public reorderTeams(oldIndex: number, newIndex: number): void {
		if (this.teams.length <= oldIndex || this.teams.length <= newIndex || oldIndex < 0 || newIndex < 0 || oldIndex == newIndex) {
			throw new Error(`Invalid indexes (${oldIndex}, ${newIndex}`)
		}
		const team = this.teams.splice(oldIndex, 1)[0]
		this.teams.splice(newIndex, 0, team)
		this.reSeedOpponents(this.teams)
	}

	public getStatus(): TournamentStatus {
		return this.status
	}
	public toggleBalanceTournament(): void {
		if (![TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status))
			throw new Error(`Tournament ${this.id} not in Running or Paused mode`)
		this.status = this.status == TournamentStatus.Open ? TournamentStatus.Balancing : TournamentStatus.Open
	}
	public startTournament(): void {
		if (![TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status))
			throw new Error(`Tournament ${this.id} not in Open or Balance mode`)
		/** TODO: Edit here the case of multi staged tournaments */
		const opponentsLength = this.settings[0].useTeams ? this.teams?.length || 0 : this.players.length
		if (this.settings[0].type == BracketType.Duel)
			this.brackets.push(new Duel(opponentsLength, this.settings[0]))
		else
			this.brackets.push(new FFA(opponentsLength, this.settings[0]))
		this.bracketsStates.forEach(bs => this.applyState(bs))
	}
	public togglePauseTournament(): void {
		if (![TournamentStatus.Paused, TournamentStatus.Running].includes(this.status))
			throw new Error(`Tournament ${this.id} not in Running or Paused mode`)
		this.status = this.status == TournamentStatus.Running ? TournamentStatus.Paused : TournamentStatus.Running
	}
	public stopTournament(): void {
		if (![TournamentStatus.Paused, TournamentStatus.Running].includes(this.status))
			throw new Error(`Tournament ${this.id} not in Running or Paused mode`)
		this.status = TournamentStatus.Open
	}

	public score(matchId: Id, score: (number | undefined)[], bracket?: number): void {
		/** TODO: Handle there partial scoring */
		if (this.getMatch(matchId, bracket).p.length != score.length)
			throw new Error(`Incompatible score sent for match ${matchId}: ${score}`)
		const state = this.bracketsStates.find(bs => bs.id == matchId && (bracket || 0) == bs.bracket)
		if (!state) {
			this.bracketsStates.push({ bracket: bracket || 0, id: matchId, score: score })
			return
		}
		state.score.forEach((value, index) => state.score[index] = value != undefined ? value : state.score[index])
		if (score.every(value => value != undefined))
			this.applyState(state)
	}

	public getMatches(bracket?: number): Match[] {
		if (this.status < TournamentStatus.Running) return []
		return this.brackets[bracket || 0].matches
	}
	public getMatch(id: Id, bracket?: number): Match {
		if (this.status < TournamentStatus.Running)
			throw new Error(`Tournament ${this.id} not started yet`)
		return this.brackets[bracket || 0].findMatch(id)
	}
	public getResults(): Result[] {
		return this.brackets[this.brackets.length - 1].results()
	}
}