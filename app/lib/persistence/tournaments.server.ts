import { logger } from "~/lib/logging/logging"
import { dbFolderPath, subscribeObjectManager, writeSafe } from "./db.server"
import * as fs from 'fs'
import * as path from 'path'
import { Tournament, TournamentInfo, TournamentStatus, TournamentTeam } from "../types/tournaments"
import { TournamentManager } from "../tournamentManager/tournamentManager"

declare global {
    var tournaments: Tournament[]
    var tournamentManagers: TournamentManager[]
}

const tournamentsFilePath = path.join(dbFolderPath, 'tournaments.json')


export function getTournament(tournamentId: string): Tournament {
    const tournament = global.tournaments.find(tournament => tournament.id == tournamentId)
    if (!tournament) throw new Error(`Tournament ${tournamentId} not found`)
    return tournament
}

subscribeObjectManager("tournaments", {
    onRestore: () => {
        if (global.tournaments) {
            return;
        }

        if (fs.existsSync(tournamentsFilePath)) {
            logger.info("Loading tournaments from persistence")
            global.tournaments = JSON.parse(fs.readFileSync(tournamentsFilePath, 'utf-8'))
            // start tournaments in running state
        } else {
            logger.info("Initialize tournaments")
            global.tournaments = []
        }
        global.tournamentManagers = []
        global.tournaments.filter(t => t.status >= TournamentStatus.Running).forEach(t => startTournamentManager(t.id))
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


export function getTournamentManager(tournamentId: string): TournamentManager {
    const tournamentManager = global.tournamentManagers.find(tm => tm.tournamentId == tournamentId)
    if (!tournamentManager) throw new Error(`Tournament manager ${tournamentId} not found`)
    return tournamentManager
}

export function getPlayerIndex(tournament: Tournament, userId: string): number {
    const index = tournament.players.findIndex(p => p.userId == userId)
    if (index == -1) throw new Error(`Player ${userId} not found in tournament ${tournament.id}`)
    return index
}

export function getTeamIndex(tournament: Tournament, teamName: string): number {
    if (!tournament.teams) throw new Error(`No teams in tournament ${tournament.id}`)
    const index = tournament.teams?.findIndex(t => t.name == teamName)
    if (index == -1) throw new Error(`Team ${teamName} not found in tournament ${tournament.id}`)
    return index
}

export function getTeam(tournament: Tournament, teamName: string): TournamentTeam {
    if (!tournament.teams) throw new Error(`No teams in tournament ${tournament.id}`)
    const team = tournament.teams?.find(p => p.name == teamName)
    if (!team) throw new Error(`Team ${teamName} not found in tournament ${tournament.id}`)
    return team
}

export function newTournament(tournament: Tournament) {
    if (global.tournaments.find(t => t.id == tournament.id)) throw new Error(`Tournament ${tournament.id} already exists`)
    global.tournaments.push(tournament)
}

export function updateTournament(tournamentId: string, partialTournament: Partial<Tournament>) {
    let tournamentIndex = global.tournaments.findIndex(tournament => tournament.id == tournamentId)
    if (tournamentIndex == -1) throw new Error(`Tournament ${tournamentId} not found`)
    global.tournaments[tournamentIndex] = { ...global.tournaments[tournamentIndex], ...partialTournament }
}

export function startTournamentManager(tournamentId: string) {
    logger.info(`Starting manager for tournament ${tournamentId}`)
    if (global.tournamentManagers.find(tm => tm.tournamentId == tournamentId))
        throw new Error(`Tournament Manager ${tournamentId} already started`)
    global.tournamentManagers.push(new TournamentManager(tournamentId))
}

