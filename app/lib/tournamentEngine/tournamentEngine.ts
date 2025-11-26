import TTLCache from "@isaacs/ttlcache"
import { BiDirectionalMap } from "../utils/BiDirectionalMap"
import { IdToString, now } from "../utils/tournaments"
import { Duel } from "./tournament/duel"
import { FFA } from "./tournament/ffa"
import { GroupStage } from "./tournament/groupstage"
import { Id } from "./tournament/match"
import {
  BracketResult,
  BracketSettings,
  BracketStatus,
  BracketType,
  Match,
  Player,
  Result,
  Seeding,
  Team,
  TournamentFullData,
  TournamentInfo,
  TournamentProperties,
  TournamentSettings,
  TournamentStatus
} from "./types"
import { range } from "../utils/ranges"
import { resultsSorter } from "../utils/sorters"

/** States used to save brackets progression */
interface BracketState {
  id: Id
  score: (number | undefined)[]
  timestamp?: number
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
  settings: BracketSettings
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
  updateBracketsSettings(bracketsSettings: BracketSettings[]): void

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

  score(matchId: Id, opponent: string, score: number | undefined): void

  getOpponentId(opponent: Player | Team): string
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
  private teams!: Team[]
  private opponentsMap: Map<string, Player | Team> = new Map()

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
    tournament.brackets = bracketSettings.map((bracketSetting) => Bracket.create(bracketSetting))
    return tournament
  }

  public static fromStorage(tournamentStorage: TournamentStorage): TournamentEngine {
    const tournament = new TournamentEngine()
    tournament.id = tournamentStorage.id
    tournament.properties = tournamentStorage.properties
    tournament.settings = tournamentStorage.settings
    tournament.status = tournamentStorage.status
    tournament.players = tournamentStorage.players
    tournament.teams = tournamentStorage.teams
    tournament.opponentsMap = new Map(
      (tournament.settings.useTeams ? tournament.teams : tournament.players).map((opponent) => [
        "name" in opponent ? opponent.name : opponent.userId,
        opponent
      ])
    )
    tournament.activeBracket = tournamentStorage.activeBracket
    tournament.brackets = tournamentStorage.brackets.map((bracket) => Bracket.fromStorage(bracket))
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
      brackets: this.brackets.map((bracket) => bracket.getStorage()),
      activeBracket: this.activeBracket
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
      bracketSettings: this.brackets.map((bracket) => bracket.settings),
      players: this.players,
      teams: this.teams,
      matches: this.getMatches(0).concat(this.brackets.length == 2 ? this.getMatches(1) : []),
      results: this.getResults(),
      bracketsResults: [TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status)
        ? undefined
        : this.brackets.map((b) => b.results())
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
    this.opponentsMap = new Map(
      (this.settings.useTeams ? this.teams : this.players).map((opponent) => [
        "name" in opponent ? opponent.name : opponent.userId,
        opponent
      ])
    )
  }
  public updateBracketsSettings(bracketSettings: BracketSettings[]): void {
    if (![TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status))
      throw new Error(`Impossible to change settings: tournament ${this.id} already started.`)
    this.brackets = bracketSettings.map((bracketSetting) => Bracket.create(bracketSetting))
  }

  public getPlayers(): Player[] {
    return this.players
  }
  private getPlayer(userId: string): Player | undefined {
    return this.players.find((player) => player.userId == userId)
  }
  public addPlayer(userId: string): void {
    if (this.getPlayer(userId)) {
      throw new Error(`Player ${userId} already in tournament ${this.id}`)
    }
    const player = { userId: userId, isForfeit: false }
    this.players.push(player)
    if (!this.settings.useTeams) this.opponentsMap.set(userId, player)
  }
  public removePlayer(userId: string): void {
    const index = this.players.findIndex((player) => player.userId == userId)
    if (index == -1) throw new Error(`Player ${userId} not found in tournament ${this.id}`)
    const deletedPlayer = this.players.splice(index, 1)
    if (!this.settings.useTeams) this.opponentsMap.delete(deletedPlayer[0].userId)
    const team = this.teams.find((team) => team.members.includes(userId))
    if (team)
      team.members.splice(
        team.members.findIndex((m) => m == userId),
        1
      )
  }
  public reorderPlayers(oldIndex: number, newIndex: number): void {
    if (
      this.players.length <= oldIndex ||
      this.players.length <= newIndex ||
      oldIndex < 0 ||
      newIndex < 0 ||
      oldIndex == newIndex
    ) {
      throw new Error(`Invalid indexes (${oldIndex}, ${newIndex}`)
    }
    const player = this.players.splice(oldIndex, 1)[0]
    this.players.splice(newIndex, 0, player)
  }

  public getTeams(): Team[] {
    return this.teams
  }
  private getTeam(teamName: string): Team | undefined {
    return this.teams.find((team) => team.name == teamName)
  }
  public addTeam(teamName: string): void {
    if (this.getTeam(teamName)) throw new Error(`Team ${teamName} already exists in tournament ${this.id}`)
    const team = { name: teamName, members: [], isForfeit: false }
    this.teams.push(team)
    if (this.settings.useTeams) this.opponentsMap.set(teamName, team)
  }
  public removeTeam(teamName: string): void {
    const index = this.teams.findIndex((team) => team.name == teamName)
    if (index == -1) throw new Error(`Team ${teamName} not found in tournament ${this.id}`)
    this.teams.splice(index, 1)
    this.opponentsMap.delete(teamName)
  }
  public renameTeam(teamName: string, newTeamName: string): void {
    const team = this.getTeam(teamName)
    if (!team) throw new Error(`Team ${teamName} not found in tournament ${this.id}`)
    team.name = newTeamName
    this.opponentsMap.set(newTeamName, team)
    this.opponentsMap.delete(teamName)
  }
  public addPlayerToTeam(teamName: string, userId: string): void {
    if (!this.getPlayer(userId)) this.addPlayer(userId)
    const team = this.getTeam(teamName)
    if (!team) throw new Error(`Team ${teamName} not found in tournament ${this.id}`)
    this.removePlayerFromTeams(userId)
    if (team.members.includes(userId))
      throw new Error(`Player ${userId} already in team ${team.name} (tournament ${this.id})`)
    team.members.push(userId)
  }
  public removePlayerFromTeams(userId: string): void {
    this.teams?.forEach((team) => {
      const index = team.members.findIndex((member) => member == userId)
      if (index != -1) team.members.splice(index, 1)
    })
  }
  public reorderTeams(oldIndex: number, newIndex: number): void {
    if (
      this.teams.length <= oldIndex ||
      this.teams.length <= newIndex ||
      oldIndex < 0 ||
      newIndex < 0 ||
      oldIndex == newIndex
    ) {
      throw new Error(`Invalid indexes (${oldIndex}, ${newIndex}`)
    }
    const team = this.teams.splice(oldIndex, 1)[0]
    this.teams.splice(newIndex, 0, team)
  }
  public distributePlayersOnTeams(): void {
    if (!this.teams.length) throw new Error(`No team in tournament ${this.id}`)
    const notInTeamPlayers = this.players.filter(
      (player) => !this.teams.flatMap((team) => team.members).includes(player.userId)
    )
    while (notInTeamPlayers.length) {
      const teams = this.teams.map((t) => t).sort((a, b) => a.members.length - b.members.length)
      if (this.settings.teamsMaxSize && teams[0].members.length >= this.settings.teamsMaxSize) break
      notInTeamPlayers
        .splice(0, Math.max(1, teams[1].members.length - teams[0].members.length))
        .forEach((p) => this.addPlayerToTeam(teams[0].name, p.userId))
    }
  }
  public balanceTeams(): void {
    if (!this.teams.length) throw new Error(`No team in tournament ${this.id}`)
    const targetMembers = Math.ceil(this.teams.flatMap((team) => team?.members).length / this.teams.length)
    while (Math.max(...this.teams.map((t) => t.members.length)) > targetMembers) {
      const teams = this.teams.map((t) => t).sort((a, b) => b.members.length - a.members.length)
      teams[teams.length - 1].members.push(teams[0].members.splice(0, 1)[0])
    }
  }
  public randomizePlayersOnTeams(): void {
    if (!this.teams.length) throw new Error(`No team in tournament ${this.id}`)
    this.teams.forEach((t) => t.members.splice(0))
    this.players.sort(() => Math.random() - 0.5)
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
    if (this.brackets[0].getStatus() != BracketStatus.Pending) {
      // This is a reset
      this.resetBrackets()
    }
    if (this.settings.useTeams) {
      this.teams = this.teams.filter((team) => team.members.length > 0)
      this.players = this.players.filter((player) => this.teams.flatMap((team) => team.members).includes(player.userId))
    }
    // resetting forfeit status in case of a re-run
    this.players.forEach((player) => (player.isForfeit = false))
    this.teams.forEach((team) => (team.isForfeit = false))
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

  public score(matchId: Id, opponent: string, score: number | undefined): void {
    if (![TournamentStatus.Paused, TournamentStatus.Running, TournamentStatus.Validating].includes(this.status))
      throw new Error(`Tournament ${this.id} not running`)
    this.internalScore(matchId, opponent, score)
    this.searchForMatchToBeCompleted()
  }

  public getOpponentId(opponent: Player | Team): string {
    return getOpponentId(opponent)
  }

  public getOpponentSeed(opponentId: string, bracket: number = this.activeBracket): number {
    return this.brackets[bracket].getOpponentSeed(opponentId) || -1
  }

  private internalScore(matchId: Id, opponent: string, score: number | undefined): void {
    const currentBracket = this.brackets[this.activeBracket]
    currentBracket.score(matchId, opponent, score)
    this.resultsCache.delete(this.activeBracket)
    this.resultsCache.delete(-1)
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

    let nextOpponents: Team[] | Player[]
    if (this.settings.useTeams) {
      nextOpponents = this.teams.slice()
    } else {
      nextOpponents = this.players.slice()
    }

    function usingResults(
      results: BracketResult[],
      bSettings: BracketSettings
    ): ((a: Team, b: Team) => number) & ((a: Player, b: Player) => number) {
      return (a, b) => {
        const resultA = results.find((r) => r.id == getOpponentId(a))!
        const resultB = results.find((r) => r.id == getOpponentId(b))!
        return resultsSorter(resultA, resultB, bSettings) || resultB.seed - resultA.seed
      }
    }
    function usingMatchId(matches: Match[]): (aId: string, bId: string) => number {
      return (aId, bId) => {
        return IdToString(matches.find((m) => m.opponents.includes(aId))!.id) <
          IdToString(matches.find((m) => m.opponents.includes(bId))!.id)
          ? -1
          : 1
      }
    }
    function usingSortedIds(sortedIds: string[]): ((a: Team, b: Team) => number) & ((a: Player, b: Player) => number) {
      return (a, b) => {
        const aId = getOpponentId(a)
        const bId = getOpponentId(b)
        return sortedIds.indexOf(aId) - sortedIds.indexOf(bId)
      }
    }

    nextOpponents.sort(usingResults(previousBracket.results(), previousBracket.settings))

    const nbPreviousMatches =
      previousBracket.settings.type == BracketType.FFA
        ? previousBracket.getMatches().length
        : new Set(previousBracket.getMatches().map((m) => m.id.s)).size

    const nextOpponentsIds: string[] = []
    for (let i = 0; i < Math.ceil(nextOpponents.length) / nbPreviousMatches; i++) {
      nextOpponentsIds.push(
        ...nextOpponents
          .slice(i * nbPreviousMatches, i * nbPreviousMatches + nbPreviousMatches)
          .map((opponent) => getOpponentId(opponent))
          .sort(usingMatchId(previousBracket.getMatches()))
      )
    }

    nextBracket.start(nextOpponents.sort(usingSortedIds(nextOpponentsIds)).slice(0, nextBracket.settings.size))
  }

  public getMatches(bracket: number = this.activeBracket): Match[] {
    if ([TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status)) return []

    return this.brackets[bracket].getMatches().map(
      (match) =>
        <Match>{
          ...match,
          bracket: bracket
        }
    )
  }
  public getMatch(id: Id, bracket: number = this.activeBracket): Match {
    if ([TournamentStatus.Open, TournamentStatus.Balancing].includes(this.status))
      throw new Error(`Tournament ${this.id} not started yet`)
    return <Match>{
      ...this.brackets[bracket].getMatch(id),
      bracket: bracket
    }
  }
  public getResults(): Result[] {
    if (!this.resultsCache.has(-1)) {
      this.computeResults()
    }
    return this.resultsCache.get(-1)!
  }

  public toggleForfeitPlayer(userId: string): void {
    const player = this.getPlayer(userId)
    if (!player) {
      throw new Error(`Player ${userId} not found`)
    }
    player.isForfeit = !player.isForfeit
    if (this.settings.useTeams) {
      const team = this.teams.find((team) => team.members.includes(userId))
      if (team) {
        team.isForfeit = team.members.every((member) => this.getPlayer(member)!.isForfeit)
      }
    }
    if (player.isForfeit) {
      this.searchForMatchToBeCompleted()
    }
  }

  private resetBrackets(): void {
    this.brackets.forEach((bracket) => bracket.reset())
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
      .filter((m) => m.scorable)
      // We want to terminate match with score missing
      .filter((m) => m.score.some((score) => score == undefined))
      .filter(shouldMatchBeCompleted)
    matchesToBeCompleted.forEach(completeMatch)
    if (matchesToBeCompleted.length > 0) {
      // We completed some match, we need to check if there is more now
      this.searchForMatchToBeCompleted()
    }
  }

  private shouldDuelMatchBeCompleted(match: Match): boolean {
    const matchOpponents = match.opponents
      .filter((opponent) => opponent != undefined)
      .map((opponent) => this.opponentsMap.get(opponent!))
    const forfeitedOpponent = matchOpponents.find((opponent) => opponent?.isForfeit)
    return !!forfeitedOpponent
  }

  private completeDuelMatch(match: Match) {
    // Don't take into account ff players' scores
    const usableScores = match.opponents
      .map((opponent) => this.opponentsMap.get(opponent!))
      .map((opponent, index) => (opponent!.isForfeit ? undefined : match.score[index]))
      .filter((_, index) => match.score[index] != undefined) as number[]
    let maxScore = usableScores.length ? Math.max(...usableScores) : 0
    let minScore = usableScores.length ? Math.min(...usableScores) : 0

    const lowerScoreIsBetter = this.brackets[match.bracket].settings.lowerScoreIsBetter

    const unscoredMatchOpponents = match.opponents
      .filter((opponent) => opponent != undefined)
      .map((opponent) => this.opponentsMap.get(opponent!))
      .filter((opponent, index) => match.score[index] == undefined || opponent!.isForfeit) // rewrite forfeit scores
    unscoredMatchOpponents.forEach((opponent) => {
      if (lowerScoreIsBetter) {
        this.internalScore(match.id, getOpponentId(opponent!), opponent?.isForfeit ? maxScore + 1 : 0)
        maxScore += 1
      } else {
        this.internalScore(match.id, getOpponentId(opponent!), opponent?.isForfeit ? minScore - 1 : 0)
        minScore -= 1
      }
    })
  }

  private shouldFFAMatchBeCompleted(match: Match): boolean {
    const ffOpponent = match.opponents
      .map((opponent) => this.opponentsMap.get(opponent!))
      .filter((opponent) => opponent!.isForfeit)
    if (ffOpponent.length == match.opponents.length - 1) return true
    const scoredMatchOpponents = match.opponents
      .filter((opponent) => opponent != undefined)
      .filter((_, index) => match.score[index] != undefined)
      .map((opponent) => this.opponentsMap.get(opponent!))
      .filter((opponent) => !opponent!.isForfeit)
    if (ffOpponent.length + scoredMatchOpponents.length == match.opponents.length) return true
    return false
  }

  private completeFFAMatch(match: Match) {
    // Don't take into account ff opponents' scores
    const usableScores = match.opponents
      .map((opponent) => this.opponentsMap.get(opponent!))
      .map((opponent, index) => (opponent!.isForfeit ? undefined : match.score[index]))
      .filter((_, index) => match.score[index] != undefined) as number[]
    let maxScore = usableScores.length ? Math.max(...usableScores) : 0
    let minScore = usableScores.length ? Math.min(...usableScores) : 0

    const lowerScoreIsBetter = this.brackets[match.bracket].settings.lowerScoreIsBetter

    const unscoredMatchOpponents = match.opponents
      .filter((opponent) => opponent != undefined)
      .map((opponent) => this.opponentsMap.get(opponent!))
      .filter((opponent, index) => match.score[index] == undefined || opponent!.isForfeit) // rewrite forfeit scores
    unscoredMatchOpponents.forEach((opponent) => {
      if (lowerScoreIsBetter) {
        this.internalScore(match.id, getOpponentId(opponent!), opponent?.isForfeit ? maxScore + 1 : 0)
        maxScore += 1
      } else {
        this.internalScore(match.id, getOpponentId(opponent!), opponent?.isForfeit ? minScore - 1 : 0)
        minScore -= 1
      }
    })
  }

  private computeResults() {
    function getPositions(results: BracketResult[]) {
      const pos: number[] = []
      const diff = (r: BracketResult) => {
        return (r.for || 0) - (r.against || 0)
      }
      results.forEach((res, index) => {
        pos.push(
          index == 0
            ? 1
            : res.pos > results[index - 1].pos
            ? pos.length + 1
            : diff(res) < diff(results[index - 1])
            ? pos.length + 1
            : (res.for || 0) < (results[index - 1].for || 0)
            ? pos.length + 1
            : pos[pos.length - 1]
        )
      })
      return pos
    }

    const retResults: Result[] = []
    const leadersPointsArray = this.properties.globalTournamentPoints.leaders.slice(0, 4)
    // 1, 2, 3, 4, 5-8, 9-16, 17-32, 33-64, etc.
    if (this.properties.globalTournamentPoints.leaders.length > 4) {
      for (let i = 4; i < this.properties.globalTournamentPoints.leaders.length; i++) {
        const start = Math.pow(2, i - 2) // 4, 8, 16, 32, etc.
        const end = Math.pow(2, i - 1) - 1 // 7, 15, 31, 63, etc.
        for (let pos = start; pos <= end; pos++) {
          leadersPointsArray.push(this.properties.globalTournamentPoints.leaders[i])
        }
      }
    }

    range(this.brackets.length - 1, 0, -1).forEach((bracket) => {
      const bracketResults = this.brackets[bracket]
        .results()
        .sort((a, b) => resultsSorter(a, b, this.brackets[bracket].settings))
      const positions = getPositions(bracketResults)
      bracketResults.forEach((res, index) => {
        const concernedUsers: string[] = []
        if (this.settings.useTeams) {
          const concernedPlayers = this.getTeam(res.id)?.members
          if (concernedPlayers) concernedUsers.push(...concernedPlayers)
        } else {
          concernedUsers.push(res.id)
        }
        concernedUsers.forEach((userId) => {
          const forfeitedPlayer = this.players.find((player) => player.userId == userId)?.isForfeit
          const userRetResult = retResults.find((rr) => rr.userId == userId)
          const userPos = this.brackets[bracket].getStatus() == BracketStatus.Done ? positions[index] : res.pos
          // finale phase
          if (!userRetResult) {
            retResults.push({
              userId: userId,
              position: userPos,
              globalTournamentPoints:
                (userPos - 1 in leadersPointsArray
                  ? leadersPointsArray[userPos - 1]
                  : this.properties.globalTournamentPoints.default) -
                (forfeitedPlayer ? this.properties.globalTournamentPoints.default : 0),
              wins: res.wins,
              for: res.for,
              against: res.against
            })
            return
          }
          // pool phase
          userRetResult.against =
            userRetResult.against || res.against ? (userRetResult.against || 0) + (res.against || 0) : undefined
          userRetResult.for =
            userRetResult.for || res.for ? (userRetResult.against || 0) + (res.against || 0) : undefined
          userRetResult.globalTournamentPoints += this.properties.globalTournamentPoints.default
          userRetResult.wins += res.wins
        })
      })
    })
    this.resultsCache.set(-1, retResults)
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
    bracket.seedings = new BiDirectionalMap(bracketStorage.seedings.map((seeding) => [seeding.seed, seeding.id]))

    if (bracket.status != BracketStatus.Pending) {
      bracket.initInternalBracket(bracket.seedings.size)
      bracket.states.forEach((bs) => bs.score.every((value) => value != undefined) && bracket.applyState(bs))
    }

    return bracket
  }

  private internalBracket?: Duel | FFA | GroupStage
  private states: BracketState[] = []
  private seedings: BiDirectionalMap<number, string> = new BiDirectionalMap()
  private status = BracketStatus.Pending
  settings!: BracketSettings

  getStorage(): BracketStorage {
    return {
      status: this.status,
      settings: this.settings,
      states: this.states,
      seedings: [...this.seedings.entries()].map((entry) => {
        return { seed: entry[0], id: entry[1] }
      })
    }
  }

  start(opponents: Player[] | Team[]) {
    this.initInternalBracket(opponents.length)
    this.seedOpponents(opponents)
    this.status = BracketStatus.Running
    this.setNewScorableTimestamps()
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
    opponents.forEach((opponent) => {
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
    if (this.status == BracketStatus.Pending) return []
    return this.internalBracket!.results().map((result) => {
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
      opponents: match.p.map((p) => this.seedings.getRight(p)),
      score: match.m || this.states.find((bs) => bs.id == match.id)?.score || match.p.map(() => undefined),
      scorable:
        this.internalBracket!.unscorable(
          match.id,
          match.p.map((_, i) => i),
          false
        ) == null
    }
  }

  getMatches() {
    if (this.status == BracketStatus.Pending) return []
    const WBR1matches = this.internalBracket!.matches.filter((m) => m.id.s == 1 && m.id.r == 1)
    const bracket_power = Math.log(2 * WBR1matches.length) / Math.log(2)
    const finalsList: string[] = []
    if (this.settings.type == BracketType.Duel) {
      if (this.settings.last == Duel.WB) {
        finalsList.push(IdToString({ s: Duel.WB, r: bracket_power, m: 1 }))
      } else {
        finalsList.push(IdToString({ s: Duel.LB, r: 2 * bracket_power - 1, m: 1 }))
        if (!this.settings.short) finalsList.push(IdToString({ s: Duel.LB, r: 2 * bracket_power, m: 1 }))
      }
    }
    if (this.settings.type == BracketType.FFA && this.internalBracket!.rounds(1).length > 1) {
      finalsList.push(
        IdToString({
          s: 1,
          r: Math.max(...this.internalBracket!.matches.map((m) => m.id.r)),
          m: 1
        })
      )
    }

    const notUsedFinale =
      (this.internalBracket!.isDone() && this.internalBracket!.matches.find((match) => !match.m)?.id) || undefined

    return this.internalBracket!.matches.filter(
      (match) => !notUsedFinale || (notUsedFinale && IdToString(notUsedFinale) != IdToString(match.id))
    ).map((match) => {
      return {
        id: match.id,
        opponents: match.p.map((p) => this.seedings.getRight(p)),
        score:
          match.m ||
          this.states.find((bs) => IdToString(bs.id) == IdToString(match.id))?.score ||
          match.p.map(() => undefined),
        scorable:
          this.internalBracket!.unscorable(
            match.id,
            match.p.map((_, i) => i),
            false
          ) == null,
        isFinale: finalsList.includes(IdToString(match.id)),
        timestamp: this.states.find((bs) => IdToString(bs.id) == IdToString(match.id))?.timestamp
      } as Match
    })
  }

  setNewScorableTimestamps(): void {
    this.getMatches()
      .filter((m) => m.scorable)
      .filter((m) => !this.states.find((bs) => IdToString(bs.id) == IdToString(m.id)))
      .forEach((m) => this.states.push({ id: m.id, score: m.score, timestamp: now() }))
  }

  score(matchId: Id, opponent: string, score: number | undefined): void {
    const match = this.getMatch(matchId)
    const opponentIndex = match.opponents.findIndex((o) => o == opponent)
    if (opponentIndex == -1) throw new Error(`Unknown opponent in match ${IdToString(matchId)}: ${opponent}`)
    const state = this.states.find((bs) => IdToString(bs.id) == IdToString(matchId))
    if (!state) {
      this.states.push({
        id: matchId,
        score: match.opponents.map((o) => (o == opponent ? score : undefined)),
        timestamp: now()
      })
      return
    }
    const previousScore = state.score.slice()
    const futureScore = state.score.map((s, i) => (i == opponentIndex ? score : s))
    if (futureScore.every((value) => value != undefined)) {
      const unscorableReason = this.internalBracket!.unscorable(matchId, futureScore as number[], false)
      if (unscorableReason != null)
        throw new Error(`Impossible to apply score ${futureScore} to match ${matchId} : ${unscorableReason}`)
    }
    state.score[opponentIndex] = score
    if (previousScore.some((s, i) => s !== state.score[i])) {
      state.timestamp = now()
    }
    if (state.score.every((value) => value != undefined)) {
      this.applyState(state)
      this.setNewScorableTimestamps()
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
    if (state.score.some((value) => value === undefined))
      throw new Error(`Tried to apply an incomplete state: ${state}`)
    const unscorableReason = this.internalBracket!.unscorable(state.id, state.score as number[], false)
    if (unscorableReason != null)
      throw new Error(`Impossible to apply score ${state.score} to match ${state.id} : ${unscorableReason}`)
    this.internalBracket!.score(state.id, state.score as number[])
  }
}

function isPlayer(value: Player | Team): value is Player {
  return Object.prototype.hasOwnProperty.call(value, "userId")
}

function getOpponentId(opponent: Player | Team) {
  if (isPlayer(opponent)) {
    return opponent.userId
  } else {
    return opponent.name
  }
}
