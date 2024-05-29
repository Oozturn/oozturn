import { logger } from "~/lib/logging/logging"
import { getPlayerIndex, getTeam, getTeamIndex, getTournament } from "~/lib/persistence/tournaments.server"
import { getUser } from "~/lib/persistence/users.server"
import { Player, TournamentStatus, TournamentTeam } from "~/lib/types/tournaments"
import { reSeedOpponents } from "~/lib/utils/tournaments"

/**
 * Tournament Management
 */
export function toggleBalanceTournament(TournamentId: string) {
    try {
        const tournament = getTournament(TournamentId)
        if ([TournamentStatus.Open, TournamentStatus.Balancing].includes(tournament.status)) {
            tournament.status = (tournament.status == TournamentStatus.Open) ? TournamentStatus.Balancing : TournamentStatus.Open
        }
        else {
            throw new Error(`Not in Balancing or Open mode`)
        }
    } catch (error) {
        logger.error(`Error while trying to put tournament ${TournamentId} in balance mode: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function addPlayerToTournament(TournamentId: string, userId: string) {
    try {
        const tournament = getTournament(TournamentId)
        if (tournament.players.find(p => p.userId == userId)) {
            throw new Error(`Player ${userId} has already joined tournament ${TournamentId}`)
        }
        if (!getUser(userId)) {
            throw new Error(`Player ${userId} not found`)
        }
        const newPlayer: Player = {
            seed: tournament.players.length,
            userId: userId,
            isForfeit: false
        }
        tournament.players.push(newPlayer)
    } catch (error) {
        logger.error(`Error while trying to add player ${userId} to tournament ${TournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function removePlayerFromTournament(TournamentId: string, userId: string) {
    try {
        const tournament = getTournament(TournamentId)
        const index = getPlayerIndex(tournament, userId)
        tournament.players.splice(index, 1)
        const playerTeam = tournament.teams?.find(team => team.members.includes(userId))
        if (playerTeam) {
            const index = playerTeam.members.findIndex(p => p == userId)
            if (index != -1) playerTeam.members.splice(index, 1)
        }
        reSeedOpponents(tournament.players)
    } catch (error) {
        logger.error(`Error while trying to remove player ${userId} from tournament ${TournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function reorderPlayers(TournamentId: string, oldIndex: number, newIndex: number) {
    try {
        const tournament = getTournament(TournamentId)
        if (tournament.players.length <= oldIndex || tournament.players.length <= newIndex || oldIndex < 0 || newIndex < 0 || oldIndex == newIndex) {
            throw new Error(`Invalid indexes (${oldIndex}, ${newIndex}`)
        }
        const player = tournament.players.splice(oldIndex, 1)[0]
        tournament.players.splice(newIndex, 0, player)
        reSeedOpponents(tournament.players)
    } catch (error) {
        logger.error(`Error while trying to reorder players in tournament ${TournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function reorderTeams(TournamentId: string, oldIndex: number, newIndex: number) {
    try {
        const tournament = getTournament(TournamentId)
        if (!tournament.teams) throw new Error(`No teams in tournament ${tournament.id}`)
        if (tournament.teams.length < oldIndex || tournament.teams.length < newIndex || oldIndex < 0 || newIndex < 0 || oldIndex == newIndex) {
            throw new Error(`Invalid indexes (${oldIndex}, ${newIndex}`)
        }
        const team = tournament.teams.splice(oldIndex, 1)[0]
        tournament.teams.splice(newIndex, 0, team)
        reSeedOpponents(tournament.teams)
    } catch (error) {
        logger.error(`Error while trying to reorder teams in tournament ${TournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}

/**
 * Team Management
 */
export function addTeamToTournament(TournamentId: string, teamName: string) {
    try {
        const tournament = getTournament(TournamentId)
        if (tournament.teams?.find(t => t.name == teamName)) {
            throw new Error(`Team ${teamName} has already been created in tournament ${TournamentId}`)
        }
        const newTeam: TournamentTeam = {
            seed: (tournament.teams || []).length,
            name: teamName,
            members: []
        }
        if (!tournament.teams)
            tournament.teams = []
        tournament.teams.push(newTeam)
    } catch (error) {
        logger.error(`Error while trying to add team ${teamName} to tournament ${TournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function removeTeamFromTournament(TournamentId: string, teamName: string) {
    try {
        const tournament = getTournament(TournamentId)
        if (!tournament.teams) throw new Error(`No teams in tournament ${tournament.id}`)
        const index = getTeamIndex(tournament, teamName)
        tournament.teams.splice(index, 1)
        reSeedOpponents(tournament.teams)
    } catch (error) {
        logger.error(`Error while trying to remove team ${teamName}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function renameTeam(TournamentId: string, oldTeamName: string, newTeamName: string) {
    try {
        const tournament = getTournament(TournamentId)
        if (tournament.teams?.find(team => team.name == newTeamName)) throw new Error(`Teams ${newTeamName} already exists in tournament ${tournament.id}`)
        const team = getTeam(tournament, oldTeamName)
        team.name = newTeamName
    } catch (error) {
        logger.error(`Error while trying to rename team ${oldTeamName}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function addPlayerToTeam(TournamentId: string, teamName: string, userId: string) {
    try {
        const tournament = getTournament(TournamentId)
        if (!tournament.players.find(player => player.userId == userId)) {
            addPlayerToTournament(TournamentId, userId)
        }
        const team = getTeam(tournament, teamName)
        removePlayerFromTeams(tournament.id, userId)
        team.members.push(userId)
    } catch (error) {
        logger.error(`Error while trying to add player ${userId} to team ${teamName}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function removePlayerFromTeams(TournamentId: string, userId: string) {
    try {
        const tournament = getTournament(TournamentId)
        tournament.teams?.forEach(team => {
            const playerIndex = team.members.findIndex(p => p == userId)
            if (playerIndex != -1) team.members.splice(playerIndex, 1)
        })
    } catch (error) {
        logger.error(`Error while trying to remove player ${userId} from teams: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function distributePlayersOnTeams(TournamentId: string) {
    // Push all 'not in team' players to a team, trying to balance the teams
    try {
        const tournament = getTournament(TournamentId)
        if (!tournament.teams) throw new Error(`No team found in tournament ${tournament.id}`)
        const notInTeamPlayers = tournament.players.filter(player => !(tournament.teams ? tournament.teams.flatMap(team => team?.members) : [] as string[]).includes(player.userId))
        while (notInTeamPlayers.length) {
            const teams = tournament.teams.map(t => t).sort((a, b) => a.members.length - b.members.length)
            if (tournament.settings.teamsMaxSize && teams[0].members.length >= tournament.settings.teamsMaxSize) break
            notInTeamPlayers.splice(0, Math.max(1, teams[1].members.length - teams[0].members.length)).forEach(p => addPlayerToTeam(TournamentId, teams[0].name, p.userId))
        }
    } catch (error) {
        logger.error(`Error while trying to distribute players in tournament ${TournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function balanceTeams(TournamentId: string) {
    // Spread evenly players already in teams to balance them
    try {
        const tournament = getTournament(TournamentId)
        if (!tournament.teams) throw new Error(`No team found in tournament ${tournament.id}`)
        const targetMembers = Math.ceil(tournament.teams.flatMap(team => team?.members).length / tournament.teams.length)
        while (Math.max(...tournament.teams.map(t => t.members.length)) > targetMembers) {
            const teams = tournament.teams.map(t => t).sort((a, b) => b.members.length - a.members.length)
            teams[teams.length - 1].members.push(teams[0].members.splice(0, 1)[0])
        }
    } catch (error) {
        logger.error(`Error while trying to balance teams in tournament ${TournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
export function randomizePlayersOnTeams(TournamentId: string) {
    // Remove all players from teams then spread them evenly
    try {
        const tournament = getTournament(TournamentId)
        if (!tournament.teams) throw new Error(`No team found in tournament ${tournament.id}`)
        tournament.teams.forEach(t => t.members.splice(0))
        tournament.players.sort((a, b) => Math.random() * 2 - 1)
        distributePlayersOnTeams(TournamentId)
    } catch (error) {
        logger.error(`Error while trying to distribute players in tournament ${TournamentId}: ${error instanceof Error ? error.message : 'Unknown Error'}`)
    }
}
