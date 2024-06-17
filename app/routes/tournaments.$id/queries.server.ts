import { logger } from "~/lib/logging/logging"
import { getTournament, cancelTournament as cancelTournamentOnPersistance } from "~/lib/persistence/tournaments.server"

/** 
 * Tournament Management
*/
export function startTournament(tournamentId: string) {
    try {
        const tournament = getTournament(tournamentId)
        logger.info(`Starting tournament ${tournamentId}`)
        tournament.startTournament()
    } catch (error) {
        logger.error(`Error while trying to start tournament ${tournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function cancelTournament(tournamentId: string) {
    try {
        logger.warn(`Deleting tournament ${tournamentId}`)
        cancelTournamentOnPersistance(tournamentId)
    } catch (error) {
        logger.error(`Error while trying to cancel tournament ${tournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function toggleBalanceTournament(tournamentId: string) {
    try {
        const tournament = getTournament(tournamentId)
        tournament.toggleBalanceTournament()
    } catch (error) {
        logger.error(`Error while trying to start tournament ${tournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function addPlayerToTournament(tournamentId: string, userId: string) {
    try {
        const tournament = getTournament(tournamentId)
        tournament.addPlayer(userId)
    } catch (error) {
        logger.error(`Error while trying to add player ${userId} to tournament ${tournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function removePlayerFromTournament(tournamentId: string, userId: string) {
    try {
        const tournament = getTournament(tournamentId)
        tournament.removePlayer(userId)
    } catch (error) {
        logger.error(`Error while trying to remove player ${userId} from tournament ${tournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function reorderPlayers(tournamentId: string, oldIndex: number, newIndex: number) {
    try {
        const tournament = getTournament(tournamentId)
        tournament.reorderPlayers(oldIndex, newIndex)
    } catch (error) {
        logger.error(`Error while trying to reorder players in tournament ${tournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function reorderTeams(tournamentId: string, oldIndex: number, newIndex: number) {
    try {
        const tournament = getTournament(tournamentId)
        tournament.reorderTeams(oldIndex, newIndex)
    } catch (error) {
        logger.error(`Error while trying to reorder teams in tournament ${tournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}

/**
 * Team Management
 */
export function addTeamToTournament(tournamentId: string, teamName: string) {
    try {
        const tournament = getTournament(tournamentId)
        tournament.addTeam(teamName)
    } catch (error) {
        logger.error(`Error while trying to add team ${teamName} to tournament ${tournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function removeTeamFromTournament(tournamentId: string, teamName: string) {
    try {
        const tournament = getTournament(tournamentId)
        tournament.removeTeam(teamName)
    } catch (error) {
        logger.error(`Error while trying to remove team ${teamName}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function renameTeam(tournamentId: string, oldTeamName: string, newTeamName: string) {
    try {
        const tournament = getTournament(tournamentId)
        tournament.renameTeam(oldTeamName, newTeamName)
    } catch (error) {
        logger.error(`Error while trying to rename team ${oldTeamName}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function addPlayerToTeam(tournamentId: string, teamName: string, userId: string) {
    try {
        const tournament = getTournament(tournamentId)
        tournament.addPlayerToTeam(teamName, userId)
    } catch (error) {
        logger.error(`Error while trying to add player ${userId} to team ${teamName}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function removePlayerFromTeams(tournamentId: string, userId: string) {
    try {
        const tournament = getTournament(tournamentId)
        tournament.removePlayerFromTeams(userId)
    } catch (error) {
        logger.error(`Error while trying to remove player ${userId} from teams: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function distributePlayersOnTeams(tournamentId: string) {
    // Push all 'not in team' players to a team, trying to balance the teams
    try {
        const tournament = getTournament(tournamentId).getFullData()
        if (!tournament.teams) throw new Error(`No team found in tournament ${tournament.id}`)
        const notInTeamPlayers = tournament.players.filter(player => !(tournament.teams ? tournament.teams.flatMap(team => team?.members) : [] as string[]).includes(player.userId))
        while (notInTeamPlayers.length) {
            const teams = tournament.teams.map(t => t).sort((a, b) => a.members.length - b.members.length)
            if (tournament.settings[0].teamsMaxSize && teams[0].members.length >= tournament.settings[0].teamsMaxSize) break
            notInTeamPlayers.splice(0, Math.max(1, teams[1].members.length - teams[0].members.length)).forEach(p => addPlayerToTeam(tournamentId, teams[0].name, p.userId))
        }
    } catch (error) {
        logger.error(`Error while trying to distribute players in tournament ${tournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function balanceTeams(tournamentId: string) {
    // Spread evenly players already in teams to balance them
    try {
        const tournament = getTournament(tournamentId).getFullData()
        if (!tournament.teams) throw new Error(`No team found in tournament ${tournament.id}`)
        const targetMembers = Math.ceil(tournament.teams.flatMap(team => team?.members).length / tournament.teams.length)
        while (Math.max(...tournament.teams.map(t => t.members.length)) > targetMembers) {
            const teams = tournament.teams.map(t => t).sort((a, b) => b.members.length - a.members.length)
            teams[teams.length - 1].members.push(teams[0].members.splice(0, 1)[0])
        }
    } catch (error) {
        logger.error(`Error while trying to balance teams in tournament ${tournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function randomizePlayersOnTeams(tournamentId: string) {
    // Remove all players from teams then spread them evenly
    try {
        const tournament = getTournament(tournamentId).getFullData()
        if (!tournament.teams) throw new Error(`No team found in tournament ${tournament.id}`)
        tournament.teams.forEach(t => t.members.splice(0))
        tournament.players.sort((a, b) => Math.random() * 2 - 1)
        distributePlayersOnTeams(tournamentId)
    } catch (error) {
        logger.error(`Error while trying to distribute players in tournament ${tournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
