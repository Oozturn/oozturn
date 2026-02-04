import { Duel } from "../tournamentEngine/tournament/duel"
import { BracketType, TournamentStatus } from "../tournamentEngine/types"
import { Statistics } from "../types/statistics"
import { range } from "../utils/ranges"
import { statsSorter } from "../utils/sorters"

declare global {
  // eslint-disable-next-line no-var
  var stats: Statistics
}
const STATISTICS_TIMEOUT = 10000

export function getStats() {
  if (!global.stats) {
    global.stats = {
      lanStats: {
        users: 0,
        avatars: 0,
        tournaments: 0,
        matches: 0,
        heats: 0
      },
      teamsStats: [],
      usersStats: [],
      timestamp: 0
    }
  }
  if (global.stats.timestamp + STATISTICS_TIMEOUT < Date.now()) {
    updateStats()
  }
  return global.stats
}

export function updateStats() {
  global.stats = {
    lanStats: {
      users: 0,
      avatars: 0,
      tournaments: 0,
      matches: 0,
      heats: 0
    },
    teamsStats: [],
    usersStats: global.users.map((user) => {
      return {
        userId: user.id,
        wonTournaments: 0,
        secondPlaces: 0,
        globalTournamentPoints: 0,
        bestTournamentPosition: -1,
        pointsRatio: -1,
        playedTournaments: 0,
        playedMatches: 0,
        winsAgainstBetterSeed: 0,
        LBWonMatches: 0,
        secondChances: 0,
        hardVictories: 0
      }
    }),
    timestamp: Date.now()
  }

  // players
  global.tournaments.forEach((tournament) => {
    if (tournament.getStatus() != TournamentStatus.Done && !global.lan.showPartialResults) return

    const tournamentResults = tournament.getResults()
    tournament.getPlayers().forEach((player) => {
      const userStat = global.stats.usersStats.find((us) => us.userId == player.userId)
      const playerResults = tournamentResults.find((result) => result.userId == player.userId)
      if (!playerResults || !userStat) {
        return
      }

      if (playerResults.position == 1) userStat.wonTournaments += 1
      if (playerResults.position == 2) userStat.secondPlaces += 1
      userStat.globalTournamentPoints += playerResults.globalTournamentPoints
      userStat.bestTournamentPosition =
        userStat.bestTournamentPosition == -1
          ? playerResults.position
          : Math.min(userStat.bestTournamentPosition, playerResults.position)

      // Normalized between -1 and 1 by the formula (for - against) / (for + against). 0 if no points were scored at all.
      const winLossRatio =
        ((playerResults && (playerResults.for || 0) + (playerResults.against || 0)
          ? ((playerResults.for || 0) - (playerResults.against || 0)) /
            ((playerResults.for || 0) + (playerResults.against || 0))
          : 0) +
          1) /
        2
      userStat.pointsRatio =
        userStat.pointsRatio == -1
          ? winLossRatio
          : (userStat.pointsRatio * userStat.playedTournaments + winLossRatio) / (userStat.playedTournaments + 1)

      userStat.playedTournaments += 1

      let LBwins = 0
      range(0, tournament.getInfo().bracketsCount - 1, 1).forEach((bracket) => {
        tournament.getMatches(bracket).forEach((match) => {
          if (!match.opponents.includes(tournament.getOpponentId(player)) || !match.score.every((s) => s != undefined))
            return

          userStat.playedMatches += 1

          const matchResult = match.opponents.map((opponent, index) => {
            return {
              opponent: opponent,
              seed: tournament.getOpponentSeed(player.userId, bracket),
              score: match.score[index]
            }
          })
          const playerMatchResult = matchResult.find(
            (mr) => mr.seed == tournament.getOpponentSeed(player.userId, bracket)
          )
          if (tournament.getSettings(0).lowerScoreIsBetter)
            userStat.winsAgainstBetterSeed += matchResult.filter(
              (mr) =>
                mr.score &&
                mr.score > (playerMatchResult?.score || 0) &&
                mr.seed > tournament.getOpponentSeed(player.userId, bracket)
            ).length
          else
            userStat.winsAgainstBetterSeed += matchResult.filter(
              (mr) =>
                mr.score &&
                mr.score < (playerMatchResult?.score || 0) &&
                mr.seed > tournament.getOpponentSeed(player.userId, bracket)
            ).length

          if (
            tournament.getSettings(match.bracket).type == BracketType.Duel &&
            tournament.getSettings(match.bracket).last == Duel.LB
          ) {
            if (
              match.id.s == Duel.LB &&
              !match.isFinale &&
              match.score[match.opponents.findIndex((o) => o == tournament.getOpponentId(player))] ==
                Math.max(...match.score.map((s) => s || 0))
            ) {
              LBwins += 1
            }
          }
        })
      })
      userStat.LBWonMatches += LBwins
      if (
        LBwins &&
        tournament.getMatches().filter((m) => m.isFinale && m.opponents.includes(tournament.getOpponentId(player)))
      )
        userStat.secondChances += 1
      if (LBwins && playerResults.position == 1) userStat.hardVictories += 1
    })
  })

  global.stats.usersStats = global.stats.usersStats.filter((us) => us.playedTournaments)

  global.stats.usersStats.sort(statsSorter)

  // teams
  global.stats.usersStats.forEach((us) => {
    const userTeam = global.users.find((user) => user.id == us.userId)?.team
    if (!userTeam) return
    const teamStat = global.stats.teamsStats.find((ts) => ts.teamName == userTeam)
    if (teamStat) {
      teamStat.globalTournamentPoints += us.globalTournamentPoints
      teamStat.members += 1
      teamStat.weightedGlobalTournamentPoints = teamStat.globalTournamentPoints / teamStat.members
      teamStat.playedTournaments += us.playedTournaments
    } else {
      global.stats.teamsStats.push({
        teamName: userTeam,
        globalTournamentPoints: us.globalTournamentPoints,
        members: 1,
        weightedGlobalTournamentPoints: us.globalTournamentPoints,
        playedTournaments: us.playedTournaments
      })
    }
  })
  if (global.lan.weightTeamsResults)
    global.stats.teamsStats.forEach(
      (ts) => (ts.globalTournamentPoints /= global.users.filter((user) => user.team == ts.teamName).length)
    )

  global.stats.teamsStats.sort((a, b) => {
    if (a.globalTournamentPoints != b.globalTournamentPoints) return b.globalTournamentPoints - a.globalTournamentPoints
    if (a.weightedGlobalTournamentPoints != b.weightedGlobalTournamentPoints)
      return b.weightedGlobalTournamentPoints - a.weightedGlobalTournamentPoints
    return a.teamName.localeCompare(b.teamName)
  })

  // lan
  global.stats.lanStats = {
    users: global.users.length,
    avatars: global.users.filter((user) => user.avatar).length,
    tournaments: global.tournaments.length,
    matches: global.tournaments.flatMap((t) => t.getMatches()).length,
    heats: global.tournaments.flatMap((t) => t.getMatches()).length
  }

  global.stats.timestamp = Date.now()
}

export function invalidateStats() {
  global.stats.timestamp = 0
}
