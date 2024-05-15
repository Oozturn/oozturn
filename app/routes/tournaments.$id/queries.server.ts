import { logger } from "~/lib/logging/logging"
import { getTournament } from "~/lib/persistence/tournaments.server"
import { Player } from "~/lib/types/tournaments"


export function addPlayerToTournament(id: string, playername: string) {
    const tournament = getTournament(id)
    if (!tournament) {
        logger.error(`Tournament ${id} not found while trying to add player ${playername}.`)
        return
    }
    if (tournament.players.find(p => p.playername == playername)) {
        logger.error(`Player ${playername} has already joined tournament ${id}.`)
        return
    }
    const newPlayer: Player = {
        seed: Math.max(...tournament.players.map(p => p.seed), -1) + 1,
        playername: playername,
        isForfeit: false
    }
    tournament.players.push(newPlayer)
}

export function removePlayerFromTournament(id: string, playername: string) {
    const tournament = getTournament(id)
    if (!tournament) {
        logger.error(`Tournament ${id} not found while trying to remove player ${playername}.`)
        return
    }
    let index = tournament.players.findIndex(p => p.playername == playername)
    if (index == -1) {
        logger.error(`Player ${playername} not found in tournament ${id}.`)
        return
    }
    tournament.players.splice(index, 1)
}