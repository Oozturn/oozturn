import TTLCache from '@isaacs/ttlcache'
import { BiDirectionalMap } from "../utils/BiDirectionalMap"
import { IdToString } from "../utils/tournaments"
import { Duel } from "./tournament/duel"
import { FFA } from "./tournament/ffa"
import { GroupStage } from "./tournament/groupstage"
import { Id } from "./tournament/match"
import { BracketResult, BracketSettings, BracketStatus, BracketType, Match, Player, Result, Seeding, Team, TournamentFullData, TournamentInfo, TournamentProperties, TournamentSettings, TournamentStatus } from "./types"

/** States used to save brackets progression */
interface BracketState {
	id: Id
	score: (number | undefined)[]
}
export interface TournamentStorage {
	id: string
	status: TournamentStatus
	players: Player[]
	teams: Team[]
	properties: TournamentProperties
	settings: TournamentSettings
	activeBracket: number
	brackets: BracketStorage[]
}

export interface BracketStorage {
	seedings: Seeding[]
	status: BracketStatus
	settings: BracketSettings,
	states: BracketState[]
}

interface TournamentSpecification {
	getId(): string
	getProperties(): TournamentProperties
	getInfo(): TournamentInfo
	getSettings(bracket?: number): BracketSettings
	getFullData(): TournamentFullData

	updateProperties(partialProperties: Partial<TournamentProperties>): void
	updateSettings(partialSettings: Partial<TournamentSettings>): void
	updateBracketSettings(partialSettings: Partial<BracketSettings>, bracket?: number): void

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

	score(matchId: Id, opponent: string, score: number): void

	getOpponentId(opponent: (Player | Team)): string
	getOpponentSeed(opponentId: string, bracket?: number): number

	getMatches(bracket?: number): Match[]
	getMatch(id: Id, bracket?: number): Match
	getResults(): Result[]

	toggleForfeitPlayer(userId: string): void
}

export class TournamentEngine implements TournamentSpecification {

	private id!: string
	private status!: TournamentStatus
	private properties!: TournamentProperties
	private settings!: TournamentSettings

	private players!: Player[]
	private playersMap: Map<string, Player> = new Map()
	private teams!: Team[]

	private activeBracket!: number
	private brackets!: Bracket[]
	private resultsCache = new TTLCache<number, Result[]>({ ttl: 1000 * 60 })

	public static create(
		id: string,
		properties: TournamentProperties,
		settings: TournamentSettings,
		bracketSettings: BracketSettings[]
	) {
		const tournament = new TournamentEngine()
		tournament.id = id
		tournament.properties = properties
		tournament.settings = settings
		tournament.status = TournamentStatus.Open
		tournament.players = []
		tournament.teams = []
		tournament.activeBracket = 0
		tournament.brackets = bracketSettings.map(bracketSetting => Bracket.create(bracketSetting))
		return tournament
	}

	public static fromStorage(tournamentStorage: TournamentStorage): TournamentEngine {
		const tournament = new TournamentEngine()
		tournament.id = tournamentStorage.id
		tournament.properties = tournamentStorage.properties
		tournament.settings = tournamentStorage.settings
		tournament.status = tournamentStorage.status
		tournament.players = tournamentStorage.players
		tournament.playersMap = new Map(tournament.players.map(player => [player.userId, player]))
		tournament.teams = tournamentStorage.teams
		tournament.activeBracket = tournamentStorage.activeBracket
		tournament.brackets = tournamentStorage.brackets.map(bracket => Bracket.fromStorage(bracket))
		return tournament
	}

	public getStorage(): TournamentStorage {
		return {
			id: this.id,
			status: this.status,
			players: this.players,
			teams: this.teams,
			properties: this.properties,
			settings: this.settings,
			brackets: this.brackets.map(bracket => bracket.getStorage()),
			activeBracket: this.activeBracket,
		}
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
			bracketsCount: this.brackets.length,
			currentBracket: this.activeBracket,
			players: this.players,
			teams: this.teams,
			...this.properties
		}
	}
	public getSettings(bracket: number = this.activeBracket): BracketSettings {
		return this.brackets[bracket].settings
	}
	public getFullData(): TournamentFullData {
		return {
			id: this.id,
			status: this.status,
			bracketsCount: this.brackets.length,
			currentBracket: this.activeBracket,
			properties: this.properties,
			settings: this.settings,
			bracketSettings: this.brackets.map(bracket => bracket.settings),
			players: this.players,
			teams: this.teams,
			matches: this.getMatches(0).concat(this.brackets.length == 2 ? this.getMatches(1) : []),
			results: [TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status) ? undefined : this.brackets.map((_b, i) => this.getResults(i)),
			bracketsResults: [TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status) ? undefined : this.brackets.map(b => b.results())
		}
	}

	public updateProperties(partialProperties: Partial<TournamentProperties>): void {
		this.properties = { ...this.properties, ...partialProperties }
		this.resultsCache.clear()
	}
	public updateSettings(partialSettings: Partial<TournamentSettings>): void {
		if (![TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status))
			throw new Error(`Impossible to change settings: tournament ${this.id} already started.`)
		this.settings = { ...this.settings, ...partialSettings }
	}
	public updateBracketSettings(partialSettings: Partial<BracketSettings>, bracket: number = this.activeBracket): void {
		if (![TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status))
			throw new Error(`Impossible to change settings: tournament ${this.id} already started.`)
		const currentSettings = this.brackets[bracket].settings
		this.brackets[bracket].settings = { ...currentSettings, ...partialSettings }
	}

	public getPlayers(): Player[] {
		return this.players
	}
	public addPlayer(userId: string): void {
		if (this.playersMap.has(userId)) {
			throw new Error(`Player ${userId} already in tournament ${this.id}`)
		}
		const player = { userId: userId, isForfeit: false }
		this.players.push(player)
		this.playersMap.set(userId, { userId: userId, isForfeit: false })
	}
	public removePlayer(userId: string): void {
		const index = this.players.findIndex(player => player.userId == userId)
		if (index == -1)
			throw new Error(`Player ${userId} not found in tournament ${this.id}`)
		const deletedPlayer = this.players.splice(index, 1)
		this.playersMap.delete(deletedPlayer[0].userId)
		const team = this.teams.find(team => team.members.includes(userId))
		if (team)
			team.members.splice(team.members.findIndex(m => m == userId), 1)
	}
	public reorderPlayers(oldIndex: number, newIndex: number): void {
		if (this.players.length <= oldIndex || this.players.length <= newIndex || oldIndex < 0 || newIndex < 0 || oldIndex == newIndex) {
			throw new Error(`Invalid indexes (${oldIndex}, ${newIndex}`)
		}
		const player = this.players.splice(oldIndex, 1)[0]
		this.players.splice(newIndex, 0, player)
	}

	public getTeams(): Team[] {
		return this.teams
	}
	public addTeam(teamName: string): void {
		if (this.teams.find(team => team.name == teamName))
			throw new Error(`Team ${teamName} already exists in tournament ${this.id}`)
		this.teams.push({ name: teamName, members: [] })
	}
	public removeTeam(teamName: string): void {
		const index = this.teams.findIndex(team => team.name == teamName)
		if (index == -1)
			throw new Error(`Team ${teamName} not found in tournament ${this.id}`)
		this.teams.splice(index, 1)
	}
	public renameTeam(teamName: string, newTeamName: string): void {
		const team = this.teams.find(team => team.name == teamName)
		if (!team)
			throw new Error(`Team ${teamName} not found in tournament ${this.id}`)
		team.name = newTeamName
	}
	public addPlayerToTeam(teamName: string, userId: string): void {
		if (!this.playersMap.has(userId))
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
	}
	public distributePlayersOnTeams(): void {
		if (!this.teams.length)
			throw new Error(`No team in tournament ${this.id}`)
		const notInTeamPlayers = this.players.filter(player => !this.teams.flatMap(team => team.members).includes(player.userId))
		while (notInTeamPlayers.length) {
			const teams = this.teams.map(t => t).sort((a, b) => a.members.length - b.members.length)
			if (this.settings.teamsMaxSize && teams[0].members.length >= this.settings.teamsMaxSize) break
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
		this.players.sort(() => Math.random() - .5)
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
	public startTournament(): void {
		if (![TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status))
			throw new Error(`Tournament ${this.id} not in Open or Balance mode`)
		if(this.brackets[0].getStatus() != BracketStatus.Pending) {
			// This is a reset
			this.resetBrackets()
		}
		if (this.settings.useTeams) {
			this.teams = this.teams.filter(team => team.members.length > 0)
			this.players = this.players.filter(player => this.teams.flatMap(team => team.members).includes(player.userId))
		}
		const opponents = this.settings.useTeams ? this.teams : this.players
		this.brackets[0].start(opponents)
		this.status = TournamentStatus.Running
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

	public score(matchId: Id, opponent: string, score: number): void {
		this.internalScore(matchId, opponent, score)
		this.searchForMatchToBeCompleted()
	}

	public getOpponentId(opponent: (Player | Team)): string {
		return getOpponentId(opponent)
	}

	public getOpponentSeed(opponentId: string, bracket: number = this.activeBracket): number {
		return this.brackets[bracket].getOpponentSeed(opponentId) || -1
	}

	private internalScore(matchId: Id, opponent: string, score: number): void {
		const currentBracket = this.brackets[this.activeBracket]
		currentBracket.score(matchId, opponent, score)
		this.resultsCache.delete(this.activeBracket)
		if (currentBracket.isWaitingForValidation()) {
			this.status = TournamentStatus.Validating
		}
	}

	public validateActiveBracket() {
		if (this.status != TournamentStatus.Validating)
			throw new Error(`Tournament ${this.id} is not waiting for validating`)
		const currentBracket = this.brackets[this.activeBracket]
		if (currentBracket.isValidated()) {
			if (this.activeBracket == this.brackets.length - 1) {
				// last bracket done
				this.status = TournamentStatus.Done
			} else {
				this.startNextBracket()
				this.status = TournamentStatus.Running
			}

		}
	}

	private startNextBracket() {
		const previousBracket = this.brackets[this.activeBracket]
		this.activeBracket++
		const nextBracket = this.brackets[this.activeBracket]

		let nextOpponents
		if (this.settings.useTeams) {
			nextOpponents = this.teams.slice()
		} else {
			nextOpponents = this.players.slice()
		}

		const results = previousBracket.results()
		nextOpponents.sort(usingResults(results))

		if (nextBracket.settings.size) {
			nextOpponents = nextOpponents.slice(0, nextBracket.settings.size)
		}

		nextBracket.start(nextOpponents)
	}

	public getMatches(bracket: number = this.activeBracket): Match[] {
		if ([TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status)) return []

		return this.brackets[bracket].getMatches().map(match => <Match>{
			...match,
			bracket: bracket
		})
	}
	public getMatch(id: Id, bracket: number = this.activeBracket): Match {
		if ([TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status))
			throw new Error(`Tournament ${this.id} not started yet`)
		return <Match>{
			...this.brackets[bracket].getMatch(id),
			bracket: bracket
		}
	}
	public getResults(bracket: number = this.activeBracket): Result[] {
		if (!this.resultsCache.has(bracket)) {
			this.computeResults(bracket)
		}
		return this.resultsCache.get(bracket)!
	}


	public toggleForfeitPlayer(userId: string): void {
		const player = this.playersMap.get(userId)
		if (!player) {
			throw new Error(`Player ${userId} not found`)
		}
		player.isForfeit = !player.isForfeit
		if (player.isForfeit && !this.settings.useTeams) {
			this.searchForMatchToBeCompleted()
		}
	}

	private resetBrackets(): void {
		this.brackets.forEach(bracket => bracket.reset())
		this.activeBracket = 0
		this.resultsCache.clear()
	}

	private searchForMatchToBeCompleted(): void {
		let shouldMatchBeCompleted: (match: Match) => boolean
		let completeMatch: (match: Match) => void
		const bracketSettings = this.brackets[this.activeBracket].settings
		if (bracketSettings.type == BracketType.Duel || bracketSettings.type == BracketType.GroupStage) {
			shouldMatchBeCompleted = this.shouldDuelMatchBeCompleted.bind(this)
			completeMatch = this.completeDuelMatch.bind(this)
		} else if (bracketSettings.type == BracketType.FFA) {
			shouldMatchBeCompleted = this.shouldFFAMatchBeCompleted.bind(this)
			completeMatch = this.completeFFAMatch.bind(this)
		} else {
			return
		}

		const matchesToBeCompleted = this.getMatches()
			// We want to terminate scorable match
			.filter(m => m.scorable)
			// We want to terminate match with score missing
			.filter(m => m.score.some(score => score == undefined))
			.filter(shouldMatchBeCompleted)
		matchesToBeCompleted.forEach(completeMatch)
		if (matchesToBeCompleted.length > 0) {
			// We completed some match, we need to check if there is more now
			this.searchForMatchToBeCompleted()
		}
	}

	private shouldDuelMatchBeCompleted(match: Match): boolean {
		const matchPlayers = match.opponents.filter(opponent => opponent != undefined)
			.map(opponent => this.playersMap.get(opponent!))
		const forfeitedPlayer = matchPlayers.find(player => player?.isForfeit)
		return !!forfeitedPlayer
	}

	private completeDuelMatch(match: Match) {
		// Don't take into account ff players' scores
		const usableScores = match.opponents.map(opponent => this.playersMap.get(opponent!))
			.map((opponent, index) => opponent!.isForfeit ? undefined : match.score[index])
			.filter((_, index) => match.score[index] != undefined) as number[]
		let maxScore = usableScores.length ? Math.max(...usableScores) : 0
		let minScore = usableScores.length ? Math.min(...usableScores) : 0

		const lowerScoreIsBetter = this.brackets[match.bracket].settings.lowerScoreIsBetter

		const unscoredMatchPlayers = match.opponents.filter(opponent => opponent != undefined)
			.map(opponent => this.playersMap.get(opponent!))
			.filter((opponent, index) => match.score[index] == undefined || opponent!.isForfeit) // rewrite forfeit scores
		unscoredMatchPlayers.forEach(opponent => {
			if (lowerScoreIsBetter) {
				this.internalScore(match.id, opponent!.userId, opponent?.isForfeit ? maxScore + 1 : 0)
				maxScore += 1
			} else {
				this.internalScore(match.id, opponent!.userId, opponent?.isForfeit ? minScore - 1 : 0)
				minScore -= 1
			}
		})
	}

	private shouldFFAMatchBeCompleted(match: Match): boolean {
		const ffPlayers = match.opponents.map(opponent => this.playersMap.get(opponent!))
			.filter(opponent => opponent!.isForfeit)
		if (ffPlayers.length == match.opponents.length - 1) return true
		const scoredMatchPlayers = match.opponents.filter(opponent => opponent != undefined)
			.filter((_, index) => match.score[index] != undefined)
			.map(opponent => this.playersMap.get(opponent!))
			.filter(opponent => !opponent!.isForfeit)
		if (ffPlayers.length + scoredMatchPlayers.length == match.opponents.length) return true
		return false
	}

	private completeFFAMatch(match: Match) {
		// Don't take into account ff players' scores
		const usableScores = match.opponents.map(opponent => this.playersMap.get(opponent!))
			.map((opponent, index) => opponent!.isForfeit ? undefined : match.score[index])
			.filter((_, index) => match.score[index] != undefined) as number[]
		let maxScore = usableScores.length ? Math.max(...usableScores) : 0
		let minScore = usableScores.length ? Math.min(...usableScores) : 0

		const lowerScoreIsBetter = this.brackets[match.bracket].settings.lowerScoreIsBetter

		const unscoredMatchPlayers = match.opponents.filter(opponent => opponent != undefined)
			.map(opponent => this.playersMap.get(opponent!))
			.filter((opponent, index) => match.score[index] == undefined || opponent!.isForfeit) // rewrite forfeit scores
		unscoredMatchPlayers.forEach(opponent => {
			if (lowerScoreIsBetter) {
				this.internalScore(match.id, opponent!.userId, opponent?.isForfeit ? maxScore + 1 : 0)
				maxScore += 1
			} else {
				this.internalScore(match.id, opponent!.userId, opponent?.isForfeit ? minScore - 1 : 0)
				minScore -= 1
			}
		})
	}

	private computeResults(bracket: number) {
		const results: Result[] = []
		this.brackets[bracket].results().forEach(res => {
			const concernedUsers: string[] = []
			if (this.settings.useTeams) {
				const concernedPlayers = this.teams.find(team => team.name == res.id)?.members
				if (concernedPlayers) concernedUsers.push(...concernedPlayers)
			} else {
				concernedUsers.push(res.id)
			}
			concernedUsers.forEach(userId => {
				const forfeitedPlayer = this.players.find(player => player.userId == userId)?.isForfeit
				results.push({
					userId: userId,
					position: res.pos,
					globalTournamentPoints: (res.pos - 1 in this.properties.globalTournamentPoints.leaders ? this.properties.globalTournamentPoints.leaders[res.pos - 1] : this.properties.globalTournamentPoints.default) - (forfeitedPlayer ? this.properties.globalTournamentPoints.default : 0),
					wins: res.wins,
					for: res.for,
					against: res.against
				})
			})
		})
		this.resultsCache.set(bracket, results)
	}
}

class Bracket {
	static create(bracketSetting: BracketSettings): Bracket {
		const bracket = new Bracket()
		bracket.settings = bracketSetting
		return bracket
	}

	static fromStorage(bracketStorage: BracketStorage): Bracket {
		const bracket = new Bracket()
		bracket.settings = bracketStorage.settings
		bracket.states = bracketStorage.states
		bracket.status = bracketStorage.status
		bracket.seedings = new BiDirectionalMap(bracketStorage.seedings.map(seeding => [seeding.seed, seeding.id]))

		if (bracket.status != BracketStatus.Pending) {
			bracket.initInternalBracket(bracket.seedings.size)
			bracket.states.forEach(bs => bs.score.every(value => value != undefined) && bracket.applyState(bs))
		}

		return bracket
	}

	private internalBracket?: (Duel | FFA | GroupStage)
	private states: BracketState[] = []
	private seedings: BiDirectionalMap<number, string> = new BiDirectionalMap()
	private status = BracketStatus.Pending
	settings!: BracketSettings

	getStorage(): BracketStorage {
		return {
			status: this.status,
			settings: this.settings,
			states: this.states,
			seedings: [...this.seedings.entries()].map(entry => { return { seed: entry[0], id: entry[1] } })
		}
	}

	start(opponents: Player[] | Team[]) {
		this.initInternalBracket(opponents.length)
		this.seedOpponents(opponents)
		this.status = BracketStatus.Running
	}

	reset(): void {
		this.seedings = new BiDirectionalMap() 
		this.status = BracketStatus.Pending
		this.states = []
		this.internalBracket = undefined
	}

	seedOpponents(opponents: Player[] | Team[]) {
		this.seedings = new BiDirectionalMap()
		let seed = 1
		opponents.forEach(opponent => {
			const id = isPlayer(opponent) ? opponent.userId : opponent.name
			this.seedings.set(seed, id)
			seed++
		})
	}

	getOpponentSeed(opponentId: string) {
		return this.seedings.getLeft(opponentId)
	}

	initInternalBracket(opponentCount: number) {
		if (this.settings.type == BracketType.Duel) {
			this.internalBracket = new Duel(opponentCount, this.settings)
		} else if (this.settings.type == BracketType.FFA) {
			this.internalBracket = new FFA(opponentCount, this.settings)
		} else if (this.settings.type == BracketType.GroupStage) {
			this.internalBracket = new GroupStage(opponentCount, this.settings)
		} else {
			throw new Error(`Unknown BracketType : ${this.settings.type}`)
		}
	}

	results(): BracketResult[] {
		if(this.status == BracketStatus.Pending) return []
		return this.internalBracket!.results()
			.map(result => {
				return {
					...result,
					id: this.seedings.getRight(result.seed)!
				}
			})
	}

	getMatch(id: Id) {
		const match = this.internalBracket!.findMatch(id)
		return {
			id: match.id,
			opponents: match.p.map(p =>
				this.seedings.getRight(p)
			),
			score: match.m || this.states.find(bs => bs.id == match.id)?.score || match.p.map(() => undefined),
			scorable: this.internalBracket!.unscorable(match.id, match.p.map((_, i) => i), false) == null
		}
	}

	getMatches() {
		if (this.status == BracketStatus.Pending) return []
		const WBR1matches = this.internalBracket!.matches.filter(m => m.id.s == 1 && m.id.r == 1)
		const bracket_power = Math.log(2 * WBR1matches.length) / Math.log(2)
		const finalsList: string[] = []
		if (this.settings.type == BracketType.Duel) {
			if (this.settings.last == Duel.WB) {
				finalsList.push(IdToString({ s: Duel.WB, r: bracket_power, m: 1 }))
			}
			else {
				finalsList.push(IdToString({ s: Duel.LB, r: 2 * bracket_power - 1, m: 1 }))
				if (!this.settings.short)
					finalsList.push(IdToString({ s: Duel.LB, r: 2 * bracket_power, m: 1 }))
			}
		}
		if (this.settings.type == BracketType.FFA && this.internalBracket!.rounds(1).length > 1) {
			finalsList.push(IdToString({ s: 1, r: Math.max(...this.internalBracket!.matches.map(m => m.id.r)), m: 1 }))
		}

		const notUsedFinale = this.internalBracket!.isDone() && this.internalBracket!.matches.find(match => !match.m)?.id || undefined

		return this.internalBracket!.matches.filter(match => !notUsedFinale || (notUsedFinale && IdToString(notUsedFinale) != IdToString(match.id))).map(match => {
			return {
				id: match.id,
				opponents: match.p.map(p =>
					this.seedings.getRight(p)
				),
				score: match.m || this.states.find(bs => IdToString(bs.id) == IdToString(match.id))?.score || match.p.map(() => undefined),
				scorable: this.internalBracket!.unscorable(match.id, match.p.map((_, i) => i), false) == null,
				isFinale: finalsList.includes(IdToString(match.id))
			}
		}
		)
	}

	score(matchId: Id, opponent: string, score: number): void {
		const match = this.getMatch(matchId)
		const opponentIndex = match.opponents.findIndex(o => o == opponent)
		if (opponentIndex == -1)
			throw new Error(`Unknown opponent in match ${IdToString(matchId)}: ${opponent}`)
		const state = this.states.find(bs => IdToString(bs.id) == IdToString(matchId))
		if (!state) {
			this.states.push({ id: matchId, score: match.opponents.map(o => o == opponent ? score : undefined) })
			return
		}
		const futureScore = state.score.map((s, i) => i == opponentIndex ? score : s)
		if (futureScore.every(value => value != undefined)) {
			const unscorableReason = this.internalBracket!.unscorable(matchId, futureScore as number[], false)
			if (unscorableReason != null)
				throw new Error(`Impossible to apply score ${futureScore} to match ${matchId} : ${unscorableReason}`)
		}
		state.score[opponentIndex] = score
		if (state.score.every(value => value != undefined)) {
			this.applyState(state)
		}
	}

	isWaitingForValidation() {
		const internalIsDone = this.internalBracket!.isDone()
		if (internalIsDone) {
			this.status = BracketStatus.Validating
		}
		return internalIsDone
	}

	isValidated() {
		if (this.status == BracketStatus.Validating) {
			this.status = BracketStatus.Done
			return true
		}
		return false
	}

	getStatus() {
		return this.status
	}

	private applyState(state: BracketState): void {
		if (state.score.some(value => value === undefined))
			throw new Error(`Tried to apply an incomplete state: ${state}`)
		const unscorableReason = this.internalBracket!.unscorable(state.id, state.score as number[], false)
		if (unscorableReason != null)
			throw new Error(`Impossible to apply score ${state.score} to match ${state.id} : ${unscorableReason}`)
		this.internalBracket!.score(state.id, state.score as number[])
	}
}

function isPlayer(value: Player | Team): value is Player {
	return Object.prototype.hasOwnProperty.call(value, 'userId');
}

function getOpponentId(opponent: Player | Team) {
	if (isPlayer(opponent)) {
		return opponent.userId
	} else {
		return opponent.name
	}
}

function usingResults(results: BracketResult[]): (((a: Team, b: Team) => number) & ((a: Player, b: Player) => number)) {
	return (a, b) => {
		const resultA = results.find(r => r.id == getOpponentId(a))!
		const resultB = results.find(r => r.id == getOpponentId(b))!
		const diffA = resultA.for! - resultA.against!
		const diffB = resultB.for! - resultB.against!
		return (resultA?.pos - resultB?.pos) || (diffB - diffA) || (resultB.seed - resultA.seed)
	}
}