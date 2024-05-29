import { logger } from "~/lib/logging/logging"
import { dbFolderPath, subscribeObjectManager, writeSafe } from "./db.server"
import * as fs from 'fs'
import * as path from 'path'
import { Tournament, TournamentInfo, TournamentTeam } from "../types/tournaments"

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

export function getTournament(id: string): Tournament {
    const tournament = global.tournaments.find(tournament => tournament.id == id)
    if (!tournament) throw new Error(`Tournament ${id} not found`)
    return tournament
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

export function updateTournament(id: string, partialTournament: Partial<Tournament>) {
    let tournamentIndex = global.tournaments.findIndex(tournament => tournament.id == id)
    if (tournamentIndex != -1) {
        global.tournaments[tournamentIndex] = { ...global.tournaments[tournamentIndex], ...partialTournament }
    } else {
        global.tournaments.push(partialTournament as Tournament)
    }
}
