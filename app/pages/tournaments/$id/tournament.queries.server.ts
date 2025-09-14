import {
  EventEndTournament,
  EventStartTournament,
  EventUpdateTournamentBracket,
  EventUpdateTournamentInfo,
  EventUpdateTournaments
} from "~/lib/emitter.server"
import { logErrorAndThrow, logger } from "~/lib/logging/logging"
import { getTournament, cancelTournament as cancelTournamentOnPersistance } from "~/lib/persistence/tournaments.server"
import { updatePlayableMatches } from "~/lib/runtimeGlobals/playableMatches.server"
import { TournamentStatus } from "~/lib/tournamentEngine/types"
import { canEditScore, StringToId } from "~/lib/utils/tournaments"
import { User } from "~/lib/types/user"

/**
 * Tournament Management
 */
export function startTournament(tournamentId: string) {
  try {
    const tournament = getTournament(tournamentId)
    logger.info(`Starting tournament ${tournamentId}`)
    tournament.startTournament()
    EventStartTournament(tournamentId)
    EventUpdateTournaments()
    updatePlayableMatches()
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to start tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function stopTournament(tournamentId: string) {
  try {
    const tournament = getTournament(tournamentId)
    logger.info(`Stoping tournament ${tournamentId}`)
    tournament.stopTournament()
    EventUpdateTournaments()
    updatePlayableMatches()
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to stop tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function cancelTournament(tournamentId: string) {
  try {
    logger.warn(`Deleting tournament ${tournamentId}`)
    cancelTournamentOnPersistance(tournamentId)
    EventUpdateTournaments()
    updatePlayableMatches()
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to cancel tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function validateTournament(tournamentId: string) {
  try {
    const tournament = getTournament(tournamentId)
    logger.info(`Validating tournament ${tournamentId}`)
    tournament.validateActiveBracket()
    EventUpdateTournamentBracket(tournamentId)
    if (tournament.getStatus() == TournamentStatus.Done) {
      EventEndTournament(tournamentId)
      EventUpdateTournaments()
      updatePlayableMatches()
    }
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to validate tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function togglePauseTournament(tournamentId: string) {
  try {
    const tournament = getTournament(tournamentId)
    tournament.togglePauseTournament()
    EventUpdateTournamentInfo(tournamentId)
    updatePlayableMatches()
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to toggle pause for tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function toggleBalanceTournament(tournamentId: string) {
  try {
    const tournament = getTournament(tournamentId)
    tournament.toggleBalanceTournament()
    EventUpdateTournamentInfo(tournamentId)
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to start tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function addPlayerToTournament(tournamentId: string, userId: string) {
  try {
    const tournament = getTournament(tournamentId)
    tournament.addPlayer(userId)
    EventUpdateTournamentInfo(tournamentId)
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to add player ${userId} to tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function toggleForfeitPlayerForTournament(tournamentId: string, userId: string) {
  try {
    const tournament = getTournament(tournamentId)
    tournament.toggleForfeitPlayer(userId)
    EventUpdateTournamentInfo(tournamentId)
    updatePlayableMatches()
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to forfeit player ${userId} for tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function removePlayerFromTournament(tournamentId: string, userId: string) {
  try {
    const tournament = getTournament(tournamentId)
    tournament.removePlayer(userId)
    EventUpdateTournamentInfo(tournamentId)
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to remove player ${userId} from tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function reorderPlayers(tournamentId: string, oldIndex: number, newIndex: number) {
  try {
    const tournament = getTournament(tournamentId)
    tournament.reorderPlayers(oldIndex, newIndex)
    EventUpdateTournamentInfo(tournamentId)
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to reorder players in tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function reorderTeams(tournamentId: string, oldIndex: number, newIndex: number) {
  try {
    const tournament = getTournament(tournamentId)
    tournament.reorderTeams(oldIndex, newIndex)
    EventUpdateTournamentInfo(tournamentId)
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to reorder teams in tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}

/**
 * Team Management
 */
export function addTeamToTournament(tournamentId: string, teamName: string) {
  try {
    const tournament = getTournament(tournamentId)
    tournament.addTeam(teamName.slice(0, 30))
    EventUpdateTournamentInfo(tournamentId)
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to add team ${teamName} to tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function removeTeamFromTournament(tournamentId: string, teamName: string) {
  try {
    const tournament = getTournament(tournamentId)
    tournament.removeTeam(teamName)
    EventUpdateTournamentInfo(tournamentId)
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to remove team ${teamName}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function renameTeam(tournamentId: string, oldTeamName: string, newTeamName: string) {
  try {
    const tournament = getTournament(tournamentId)
    tournament.renameTeam(oldTeamName, newTeamName.slice(0, 30))
    EventUpdateTournamentInfo(tournamentId)
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to rename team ${oldTeamName}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function addPlayerToTeam(tournamentId: string, teamName: string, userId: string) {
  try {
    const tournament = getTournament(tournamentId)
    tournament.addPlayerToTeam(teamName, userId)
    EventUpdateTournamentInfo(tournamentId)
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to add player ${userId} to team ${teamName}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function removePlayerFromTeams(tournamentId: string, userId: string) {
  try {
    const tournament = getTournament(tournamentId)
    tournament.removePlayerFromTeams(userId)
    EventUpdateTournamentInfo(tournamentId)
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to remove player ${userId} from teams: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function distributePlayersOnTeams(tournamentId: string) {
  // Push all 'not in team' players to a team, trying to balance the teams
  try {
    const tournament = getTournament(tournamentId)
    tournament.distributePlayersOnTeams()
    EventUpdateTournamentInfo(tournamentId)
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to distribute players in tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function balanceTeams(tournamentId: string) {
  // Spread evenly players already in teams to balance them
  try {
    const tournament = getTournament(tournamentId)
    tournament.balanceTeams()
    EventUpdateTournamentInfo(tournamentId)
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to balance teams in tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
export function randomizePlayersOnTeams(tournamentId: string) {
  // Remove all players from teams then spread them evenly
  try {
    const tournament = getTournament(tournamentId)
    tournament.randomizePlayersOnTeams()
    EventUpdateTournamentInfo(tournamentId)
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to distribute players in tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}

export function scoreMatch(tournamentId: string, matchID: string, opponent: string, score: number | null, user: User) {
  // Scores a match
  try {
    const tournament = getTournament(tournamentId)
    if (
      !canEditScore(
        tournament.getMatch(StringToId(matchID)),
        opponent,
        tournament.getFullData(),
        user,
        process.env.ALL_OPPONENTS_SCORE === "duel_only" ? "duel_only"
        : process.env.ALL_OPPONENTS_SCORE === "true" ? true
        : false
      )
    )
      return
    tournament.score(StringToId(matchID), opponent, score === null ? undefined : score)
    EventUpdateTournamentBracket(tournamentId)
    updatePlayableMatches()
  } catch (error) {
    logErrorAndThrow(
      `Error while trying to score in match ${matchID} of tournament ${tournamentId}: ${error instanceof Error ? error.message : "Unknown Error"}`
    )
  }
}
