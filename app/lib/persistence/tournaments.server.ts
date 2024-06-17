import { logger } from "~/lib/logging/logging"
import { dbFolderPath, subscribeObjectManager, writeSafe } from "./db.server"
import * as fs from 'fs'
import * as path from 'path'
import { TournamentEngine, TournamentStorage } from "../tournamentEngine/tournamentEngine"
import { BracketSettings, TournamentFullData, TournamentInfo, TournamentProperties } from "../tournamentEngine/types"

declare global {
    var tournaments: TournamentEngine[]
}

const tournamentsFilePath = path.join(dbFolderPath, 'tournaments.json')

subscribeObjectManager("tournaments", {
    onRestore: () => {
        if (global.tournaments) {
            return;
        }

        if (fs.existsSync(tournamentsFilePath)) {
            logger.info("Loading tournaments from persistence")
            global.tournaments = (JSON.parse(fs.readFileSync(tournamentsFilePath, 'utf-8')) as TournamentStorage[]).map(ts => TournamentEngine.fromStorage(ts))
            // start tournaments in running state
        } else {
            logger.info("Initialize tournaments")
            global.tournaments = []
        }
    },
    onStore: () => {
        writeSafe(tournamentsFilePath, JSON.stringify(global.tournaments.map(tournament => tournament.getStorage()), null, 2))
    }
})

export function getTournament(tournamentId: string): TournamentFullData {
    const tournament = global.tournaments.find(tournament => tournament.getId() == tournamentId)
    if (!tournament) throw new Error(`Tournament ${tournamentId} not found`)
    return tournament.getFullData()
}

export function getTournaments(): TournamentInfo[] {
    return global.tournaments.map(t => t.getInfo())
}

export function getTournamentEngine(tournamentId: string): TournamentEngine {
    const tournament = global.tournaments.find(tournament => tournament.getId() == tournamentId)
    if (!tournament) throw new Error(`Tournament ${tournamentId} not found`)
    return tournament
}

export function newTournament(tournamentId: string, properties: TournamentProperties, settings: BracketSettings[]) {
    if (global.tournaments.find(t => t.getId() == tournamentId)) throw new Error(`Tournament ${tournamentId} already exists`)
    global.tournaments.push(new TournamentEngine(tournamentId, properties, settings))
}

export function cancelTournament(tournamentId: string) {
    const index = global.tournaments.findIndex(tournament => tournament.getId() == tournamentId)
    if (index ==  -1) throw new Error(`Tournament ${tournamentId} not found`)
    global.tournaments.splice(index, 1)
}

export function updateTournamentProperties(tournamentId: string, partialProperties: Partial<TournamentProperties>) {
    let tournament = global.tournaments.find(tournament => tournament.getId() == tournamentId)
    if (!tournament) throw new Error(`Tournament ${tournamentId} not found`)
    tournament.updateProperties(partialProperties)
}

export function updateTournamentSettings(tournamentId: string, partialSettings: Partial<BracketSettings>) {
    let tournament = global.tournaments.find(tournament => tournament.getId() == tournamentId)
    if (!tournament) throw new Error(`Tournament ${tournamentId} not found`)
    tournament.updateSettings(partialSettings)
}

