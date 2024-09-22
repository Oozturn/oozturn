import { logger } from "~/lib/logging/logging"
import { dbFolderPath, subscribeObjectManager, writeSafe } from "./db.server"
import * as fs from 'fs'
import * as path from 'path'
import { Lan } from "../types/lan"
import { EventUpdateLan } from "../emitter.server"
import { invalidateStats } from "../statistics/statistics.server"
import { Achievement } from "../types/achievements"
import { getAchievements } from "../statistics/achievements.server"

declare global {
    // eslint-disable-next-line no-var
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
    weightTeamsResults: true,
    showTeamsResults: true,
    showAchievements: true,
    achievements: []
}

subscribeObjectManager("lan", {
    onRestore: () => {
        if (global.lan) {
            return
        }

        if (fs.existsSync(lanFilePath)) {
            logger.info("Loading lan from persistence")
            global.lan = { ...defaultLan, ...JSON.parse(fs.readFileSync(lanFilePath, 'utf-8')) }
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
    EventUpdateLan()
    global.lan = { ...lan, ...partialLan }
    if (partialLan.weightTeamsResults != undefined
        || partialLan.showPartialResults != undefined) {
        invalidateStats()
    }
}

export function updateAchievements(partialAchievements: Partial<Achievement>[]) {
    partialAchievements.forEach(partialAchievement => {
        if (!partialAchievement.type) return
        const achievementIndex = global.lan.achievements.findIndex(a => a.type == partialAchievement.type)
        const defaultValue = getAchievements().find(a => a.type == partialAchievement.type)
        if (!defaultValue) return
        if (achievementIndex != -1) {
            global.lan.achievements[achievementIndex] = { ...global.lan.achievements[achievementIndex], ...partialAchievement }
        } else {
            global.lan.achievements.push({ ...defaultValue, ...partialAchievement })
        }
    })
}