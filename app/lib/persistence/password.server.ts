import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'
import { logger } from "~/lib/logging/logging"
import { dbFolderPath, subscribeObjectManager, writeSafe } from "./db.server"
const { hashSync, compareSync } = bcrypt

declare global {
    var passwords: { [id: string]: string }
}

const passwordsFilePath = path.join(dbFolderPath, 'passwords.json')

subscribeObjectManager("passwords", {
    onRestore: () => {
        if (global.passwords) {
            return;
        }
        if (fs.existsSync(passwordsFilePath)) {
            logger.info("Loading passwords from persistence")
            global.passwords = JSON.parse(fs.readFileSync(passwordsFilePath, 'utf-8'))
        } else {
            logger.info("Initialize passwords")
            global.passwords = {}
        }
    },
    onStore: () => {
        writeSafe(passwordsFilePath, JSON.stringify(global.passwords, null, 2))
    }
})

export function checkPassword(userId: string, password: string) {
    const hash = global.passwords[userId]
    return compareSync(password, hash)
}

export function hasPassword(userId: string) {
    return !!global.passwords[userId]
}

export function storePassword(userId: string, password: string) {
    const hash = hashSync(password, 8)
    global.passwords[userId] = hash
}

export function resetPassword(userId: string) {
    delete global.passwords[userId]
}