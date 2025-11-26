import { logger } from "~/lib/logging/logging"
import { dbFolderPath, subscribeObjectManager, writeSafe } from "./db.server"
import * as fs from 'fs'
import * as path from 'path'
import { TournamentEngine, TournamentStorage } from "../tournamentEngine/tournamentEngine"
import { BracketSettings, TournamentInfo, TournamentProperties, TournamentSettings } from "../tournamentEngine/types"
import { EventUpdateTournamentBracket, EventUpdateTournamentInfo, EventUpdateTournaments, EventUpdateTournamentSettings } from "../emitter.server"

declare global {
    // eslint-disable-next-line no-var
    var tournaments: TournamentEngine[]
}

const tournamentsFilePath = path.join(dbFolderPath, 'tournaments.json')

function scoresReviver(key: string, value: unknown) {
    if (key === "score" && Array.isArray(value)) {
        return (value as Array<unknown>).map((score: unknown) => (score === null ? undefined : score))
    }
    return value
}

subscribeObjectManager("tournaments", {
    onRestore: () => {
        if (global.tournaments) {
            return
        }

        if (fs.existsSync(tournamentsFilePath)) {
            logger.info("Loading tournaments from persistence")
            global.tournaments = (JSON.parse(fs.readFileSync(tournamentsFilePath, 'utf-8'), scoresReviver) as TournamentStorage[]).map(ts => TournamentEngine.fromStorage(ts))
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

export function getTournament(tournamentId: string): TournamentEngine {
    const tournament = global.tournaments.find(tournament => tournament.getId() == tournamentId)
    if (!tournament) throw new Error(`Tournament ${tournamentId} not found`)
    return tournament
}

export function getTournaments(): TournamentInfo[] {
    return global.tournaments.map(t => t.getInfo())
}

export function newTournament(tournamentId: string, properties: TournamentProperties, settings:TournamentSettings, bracketSettings: BracketSettings[]) {
    if (global.tournaments.find(t => t.getId() == tournamentId)) throw new Error(`Tournament ${tournamentId} already exists`)
    global.tournaments.push(TournamentEngine.create(tournamentId, properties, settings, bracketSettings))
    EventUpdateTournaments()
    logger.debug(`Created new tournament ${tournamentId}`)
}

export function cancelTournament(tournamentId: string) {
    const index = global.tournaments.findIndex(tournament => tournament.getId() == tournamentId)
    if (index == -1) throw new Error(`Tournament ${tournamentId} not found`)
    global.tournaments.splice(index, 1)
    EventUpdateTournaments()
    logger.debug(`Cancelled tournament ${tournamentId}`)
}

export function updateTournamentProperties(tournamentId: string, partialProperties: Partial<TournamentProperties>) {
    const tournament = global.tournaments.find(tournament => tournament.getId() == tournamentId)
    if (!tournament) throw new Error(`Tournament ${tournamentId} not found`)
    tournament.updateProperties(partialProperties)
    EventUpdateTournamentInfo(tournamentId)
    logger.debug(`Updated properties for tournament ${tournamentId} : ${JSON.stringify(partialProperties)}`)
}

export function updateTournamentSettings(tournamentId: string, partialSettings: Partial<TournamentSettings>) {
    const tournament = global.tournaments.find(tournament => tournament.getId() == tournamentId)
    if (!tournament) throw new Error(`Tournament ${tournamentId} not found`)
    tournament.updateSettings(partialSettings)
    EventUpdateTournamentSettings(tournamentId)
    logger.debug(`Updated settings for tournament ${tournamentId} : ${JSON.stringify(partialSettings)}`)
}

export function updateTournamentBracketSettings(tournamentId: string, settings: BracketSettings[]) {
    const tournament = global.tournaments.find(tournament => tournament.getId() == tournamentId)
    if (!tournament) throw new Error(`Tournament ${tournamentId} not found`)
    tournament.updateBracketsSettings(settings)
    EventUpdateTournamentBracket(tournamentId)
    logger.debug(`Updated bracket settings for tournament ${tournamentId} : ${JSON.stringify(settings)}`)
}

