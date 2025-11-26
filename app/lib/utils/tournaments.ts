import { Id } from "../tournamentEngine/tournament/match"
import { BracketType, Match, TournamentFullData, TournamentStatus } from "../tournamentEngine/types"
import { User } from "../types/user"

export function GetFFAMaxPlayers(opponents: number[], advancers: number[]) {
  if (!opponents) return 0
  if (opponents.length != advancers.length + 1) return 0
  let maxPlayers = opponents[opponents.length - 1]
  for (let i = opponents.length - 2; i >= 0; i--) {
    maxPlayers = (maxPlayers / advancers[i]) * opponents[i]
  }
  return maxPlayers
}

export function IdToString(id: Id): string {
  return id.s + "." + id.r + "." + id.m
}
export function StringToId(str: string): Id {
  const [s, r, m] = str.split(".")
  return { s: Number(s), r: Number(r), m: Number(m) }
}

export function canEditScore(
  match: Match,
  opponentId: string | undefined,
  tournament: TournamentFullData,
  user: User,
  allopponentScoreSetting: boolean | "duel_only"
) {
  if (!match.scorable) return false
  if (!opponentId) return false
  if (![TournamentStatus.Running, TournamentStatus.Paused, TournamentStatus.Validating].includes(tournament.status))
    return false
  if (!user.isAdmin && tournament.status != TournamentStatus.Running) return false
  if (
    user.isAdmin &&
    [TournamentStatus.Running, TournamentStatus.Paused, TournamentStatus.Validating].includes(tournament.status)
  )
    return true

  const userTeam = tournament.settings.useTeams
    ? tournament.teams.find((team) => team.members.includes(user.id))
    : undefined
  if (userTeam && user.id != userTeam.members[0]) return false

  const idToUse = userTeam ? userTeam.name : user.id
  if (idToUse == opponentId) return true

  if (tournament.bracketSettings[match.bracket].type == BracketType.FFA) {
    if (allopponentScoreSetting === true && match.opponents.includes(idToUse)) return true
  } else if (allopponentScoreSetting != false && match.opponents.includes(idToUse)) return true

  return false
}

export function now() {
  return new Date().getTime()
}
