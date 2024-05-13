import { logger } from "~/lib/logging/logging"
import { dbFolderPath, subscribeObjectManager, writeSafe } from "./db.server"
import * as fs from 'fs'
import * as path from 'path'
import { Tournament, TournamentInfo } from "../types/tournaments"

declare global {
    var tournaments: Tournament[]
}

const tournamentsFilePath = path.join(dbFolderPath, 'tournaments.json')

subscribeObjectManager("tournaments", {
    onRestore: () => {
        if (global.tournaments) {
            return;
        }

        if (fs.existsSync(tournamentsFilePath)) {
            logger.info("Loading tournaments from persistence")
            global.tournaments = JSON.parse(fs.readFileSync(tournamentsFilePath, 'utf-8'))
        } else {
            logger.info("Initialize tournaments")
            global.tournaments = []
        }
    },
    onStore: () => {
        writeSafe(tournamentsFilePath, JSON.stringify(global.tournaments, null, 2))
    }
})

export function getTournaments(): TournamentInfo[] {
    return global.tournaments.map(tournament => {
        return {
            id: tournament.id,
            name: tournament.name,
            game: tournament.game,
            status: tournament.status,
            players: tournament.players,
            comments: tournament.comments
        }
    })
}

export function getTournament(id: string): Tournament | undefined {
    return global.tournaments.find(tournament => tournament.id == id)
}

export function updateTournament(id: string, partialTournament: Partial<Tournament>) {
    let tournamentIndex = global.tournaments.findIndex(tournament => tournament.id == id)
    if (tournamentIndex != -1) {
        global.tournaments[tournamentIndex] = { ...global.tournaments[tournamentIndex], ...partialTournament }
    }
}