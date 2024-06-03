import { logger } from "~/lib/logging/logging"
import { dbFolderPath, subscribeObjectManager, writeSafe } from "./db.server"
import * as fs from 'fs'
import * as path from 'path'
import { Lan } from "../types/lan"

declare global {
    var lan: Lan
}

const lanFilePath = path.join(dbFolderPath, 'lan.json')

const defaultLan: Lan = {
    name: "New LAN",
    motd: "Let's play!",
    startDate: { day: 5, hour: 18, min: 0 },
    endDate: { day: 0, hour: 14, min: 0 },
    newUsersByAdminOnly: false,
    authenticationNeeded: false,
    globalTournamentDefaultPoints: { leaders: [10, 6, 4, 2], default: 1 },
    showPartialResults: false,
    weightTeamsResults: false,
    showTeamsResults: false,
}

subscribeObjectManager("lan", {
    onRestore: () => {
        if (global.lan) {
            return;
        }

        if (fs.existsSync(lanFilePath)) {
            logger.info("Loading lan from persistence")
            global.lan = {...defaultLan,  ...JSON.parse(fs.readFileSync(lanFilePath, 'utf-8'))}
        } else {
            logger.info("Initialize lan with default")
            global.lan = defaultLan
        }
    },
    onStore: () => {
        writeSafe(lanFilePath, JSON.stringify(global.lan, null, 2))
    }
})

export function getLan() {
    return global.lan
}

export function updateLan(partialLan: Partial<Lan>) {
    global.lan = { ...lan, ...partialLan }
}