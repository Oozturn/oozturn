import { logger } from "~/lib/logging/logging"
import { dbFolderPath, subscribeObjectManager } from "./db.server"
import * as fs from 'fs'
import * as path from 'path'
import { Tournament } from "../types/tournaments"

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
            global.tournaments = JSON.parse(fs.readFileSync(tournamentsFilePath, 'utf-8'))
        } else {
            logger.info("Initialise tournaments")
            global.tournaments = []
        }
    },
    onStore: () => {
        fs.writeFileSync(tournamentsFilePath, JSON.stringify(global.tournaments, null, 2), 'utf-8')
    }
})

export function getTournaments() {
    return global.tournaments
}

export function getTournament(id: string) {
    return global.tournaments.find(tournament => tournament.id == id)
}

export function updateTournament(id: string, partialTournament: Partial<Tournament>) {
    let tournamentIndex = global.tournaments.findIndex(tournament => tournament.id == id)
    if (tournamentIndex != -1) {
        global.tournaments[tournamentIndex] = { ...global.tournaments[tournamentIndex], ...partialTournament }
    }
}