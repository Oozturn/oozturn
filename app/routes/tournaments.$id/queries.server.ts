import { logger } from "~/lib/logging/logging"
import { getTournament } from "~/lib/persistence/tournaments.server"
import { Player } from "~/lib/types/tournaments"


export function addPlayerToTournament(id: string, userId: string) {
    const tournament = getTournament(id)
    if (!tournament) {
        logger.error(`Tournament ${id} not found while trying to add player ${userId}.`)
        return
    }
    if (tournament.players.find(p => p.userId == userId)) {
        logger.error(`Player ${userId} has already joined tournament ${id}.`)
        return
    }
    const newPlayer: Player = {
        seed: Math.max(...tournament.players.map(p => p.seed), -1) + 1,
        userId: userId,
        isForfeit: false
    }
    tournament.players.push(newPlayer)
}

export function removePlayerFromTournament(id: string, userId: string) {
    const tournament = getTournament(id)
    if (!tournament) {
        logger.error(`Tournament ${id} not found while trying to remove player ${userId}.`)
        return
    }
    let index = tournament.players.findIndex(p => p.userId == userId)
    if (index == -1) {
        logger.error(`Player ${userId} not found in tournament ${id}.`)
        return
    }
    tournament.players.splice(index, 1)
}