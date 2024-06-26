import { IdToString } from "../utils/tournaments";
import { Duel } from "./tournament/duel"
import { FFA } from "./tournament/ffa"
import { Id } from "./tournament/match";
import { Result } from "./tournament/tournament"
import { BracketSettings, BracketType, Match, Player, Team, TournamentFullData, TournamentInfo, TournamentProperties, TournamentStatus } from "./types";

/** States used to save brackets progression */
interface BracketState {
	bracket: number
	id: Id
	score: (number | undefined)[]
}
export interface TournamentStorage {
	id: string
	status: TournamentStatus
	players: Player[]
	teams: Team[]
	properties: TournamentProperties
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
	distributePlayersOnTeams(): void
	balanceTeams(): void
	randomizePlayersOnTeams(): void

	getStatus(): TournamentStatus
	toggleBalanceTournament(): void
	startTournament(resume: boolean): void
	togglePauseTournament(): void
	stopTournament(): void

	score(matchId: Id, opponent: string, score: number, bracket?: number): void

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
		if (![TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status))
			this.startTournament(true)
	}
	public getStorage(): TournamentStorage {
		return {
			id: this.id,
			status: this.status,
			players: this.players,
			teams: this.teams,
			properties: this.properties,
			settings: [this.getSettings()],
			states: this.bracketsStates
		}
	}
	public static fromStorage(tournamentStorage: TournamentStorage): TournamentEngine {
		return new TournamentEngine(
			tournamentStorage.id,
			tournamentStorage.properties,
			tournamentStorage.settings,
			tournamentStorage.status,
			tournamentStorage.players,
			tournamentStorage.teams,
			tournamentStorage.states
		)
	}

	private reSeedOpponents(opponents: Team[] | Player[]): void {
		opponents.forEach((opponent, index) => opponent.seed = index)
	}
	private applyState(state: BracketState): void {
		if (state.score.some(value => value === undefined))
			throw new Error(`Tried to apply an incomplete state: ${state}`)
		const unscorableReason = this.brackets[state.bracket].unscorable(state.id, state.score as number[], false)
		if (unscorableReason != null)
			throw new Error(`Impossible to apply score ${state.score} to match ${state.id} : ${unscorableReason}`)
		this.brackets[state.bracket].score(state.id, state.score as number[])
		if (this.brackets[state.bracket].isDone()) this.status = TournamentStatus.Done
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
	public getSettings(bracket: number = 0): BracketSettings {
		return this.settings[bracket]
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
	public updateSettings(partialSettings: Partial<BracketSettings>, bracket: number = 0): void {
		this.settings[bracket] = { ...this.settings[bracket], ...partialSettings }
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
			this.addPlayer(userId)
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
	public distributePlayersOnTeams(): void {
		if (!this.teams.length)
			throw new Error(`No team in tournament ${this.id}`);
		const notInTeamPlayers = this.players.filter(player => !this.teams.flatMap(team => team.members).includes(player.userId))
		while (notInTeamPlayers.length) {
			const teams = this.teams.map(t => t).sort((a, b) => a.members.length - b.members.length)
			if (this.settings[0].teamsMaxSize && teams[0].members.length >= this.settings[0].teamsMaxSize) break
			notInTeamPlayers.splice(0, Math.max(1, teams[1].members.length - teams[0].members.length)).forEach(p => this.addPlayerToTeam(teams[0].name, p.userId))
		}
	}
	public balanceTeams(): void {
		if (!this.teams.length)
			throw new Error(`No team in tournament ${this.id}`)
		const targetMembers = Math.ceil(this.teams.flatMap(team => team?.members).length / this.teams.length)
		while (Math.max(...this.teams.map(t => t.members.length)) > targetMembers) {
			const teams = this.teams.map(t => t).sort((a, b) => b.members.length - a.members.length)
			teams[teams.length - 1].members.push(teams[0].members.splice(0, 1)[0])
		}
	}
	public randomizePlayersOnTeams(): void {
		if (!this.teams.length)
			throw new Error(`No team in tournament ${this.id}`)
		this.teams.forEach(t => t.members.splice(0))
		this.players.sort((a, b) => Math.random() - .5)
		this.distributePlayersOnTeams()
	}

	public getStatus(): TournamentStatus {
		return this.status
	}
	public toggleBalanceTournament(): void {
		if (![TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status))
			throw new Error(`Tournament ${this.id} not in Running or Paused mode`)
		this.status = this.status == TournamentStatus.Open ? TournamentStatus.Balancing : TournamentStatus.Open
	}
	public startTournament(resume: boolean = false): void {
		if (!resume && ![TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status))
			throw new Error(`Tournament ${this.id} not in Open or Balance mode`)
		/** TODO: Edit here the case of multi staged tournaments */
		const opponentsLength = this.settings[0].useTeams ? this.teams?.length || 0 : this.players.length
		if (this.settings[0].type == BracketType.Duel)
			this.brackets = [new Duel(opponentsLength, this.settings[0])]
		else
			this.brackets = [new FFA(opponentsLength, this.settings[0])]
		this.status = TournamentStatus.Running
		if (!resume) this.bracketsStates = []
		else this.bracketsStates.forEach(bs => bs.score.every(value => value != undefined) && this.applyState(bs))
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

	public score(matchId: Id, opponent: string, score: number, bracket: number = 0): void {
		/** TODO: Handle there partial scoring */
		const match = this.getMatch(matchId, bracket)
		const opponentIndex = match.opponents.findIndex(o => o == opponent)
		if (opponentIndex == -1)
			throw new Error(`Unknown opponent in match ${IdToString(matchId)}: ${opponent}`)
		const state = this.bracketsStates.find(bs => IdToString(bs.id) == IdToString(matchId) && bracket == bs.bracket)
		if (!state) {
			this.bracketsStates.push({ bracket: bracket, id: matchId, score: match.opponents.map(o => o == opponent ? score : undefined) })
			return
		}
		const futureScore = state.score.map((s, i) => i == opponentIndex ? score : s)
		if (futureScore.every(value => value != undefined)) {
			const unscorableReason = this.brackets[bracket].unscorable(matchId, futureScore as number[], false)
			if (unscorableReason != null)
				throw new Error(`Impossible to apply score ${futureScore} to match ${matchId} : ${unscorableReason}`)
		}
		state.score[opponentIndex] = score
		if (state.score.every(value => value != undefined)) {
			this.applyState(state)
		}
	}

	public getMatches(bracket: number = 0): Match[] {
		if ([TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status)) return []
		return this.brackets[bracket].matches.map(match =>
			<Match>{
				bracket: bracket,
				id: match.id,
				opponents: match.p.map(p =>
					this.settings[bracket].useTeams ?
						this.teams.find(team => team.seed + 1 == p)?.name
						:
						this.players.find(player => player.seed + 1 == p)?.userId
				),
				score: match.m || this.bracketsStates.find(bs => IdToString(bs.id) == IdToString(match.id) && (bracket) == bs.bracket)?.score || match.p.map(_ => undefined),
				scorable: this.brackets[bracket].unscorable(match.id, match.p.map((_, i) => i), false) == null
			}
		)
	}
	public getMatch(id: Id, bracket: number = 0): Match {
		if ([TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status))
			throw new Error(`Tournament ${this.id} not started yet`)
		const match = this.brackets[bracket].findMatch(id)
		return <Match>{
			bracket: bracket,
			id: match.id,
			opponents: match.p.map(p =>
				this.settings[bracket].useTeams ?
					this.teams.find(team => team.seed + 1 == p)?.name
					:
					this.players.find(player => player.seed + 1 == p)?.userId
			),
			score: match.m || this.bracketsStates.find(bs => bs.id == match.id)?.score || match.p.map(_ => undefined),
			scorable: this.brackets[bracket].unscorable(match.id, match.p.map((_, i) => i), false) == null
		}
	}
	public getResults(): Result[] {
		return this.brackets[this.brackets.length - 1].results()
	}
}