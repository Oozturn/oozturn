import { logger } from "~/lib/logging/logging"
import { dbFolderPath, subscribeObjectManager } from "./db.server"
import * as fs from 'fs'
import * as path from 'path'
import { Game } from "../types/games"

declare global {
    var games: Game[]
}

const gamesFilePath = path.join(dbFolderPath, 'games.json')

subscribeObjectManager("games", {
    onRestore: () => {
        if (global.games) {
            return;
        }

        if (fs.existsSync(gamesFilePath)) {
            logger.info("Loading games from persistence")
            global.games = JSON.parse(fs.readFileSync(gamesFilePath, 'utf-8'))
        } else {
            logger.info("Initialize games")
            global.games = []
        }
    },
    onStore: () => {
        fs.writeFileSync(gamesFilePath, JSON.stringify(global.games, null, 2), 'utf-8')
    }
})

export function getGames() {
    return global.games
}

export function getGame(id: number) {
    return global.games.find(game => game.id == id)
}

export function updateGame(id: number, partialGame: Partial<Game>) {
    let gameIndex = global.games.findIndex(game => game.id == id)
    if (gameIndex != -1) {
        global.games[gameIndex] = { ...global.games[gameIndex], ...partialGame }
    } else {
        global.games.push(partialGame as Game)
    }
}