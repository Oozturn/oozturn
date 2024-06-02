import { logger } from "~/lib/logging/logging"
import { dbFolderPath, subscribeObjectManager, writeSafe } from "./db.server"
import * as fs from 'fs'
import * as path from 'path'
import { User } from "../types/user"

declare global {
    var users: User[]
}

const usersFilePath = path.join(dbFolderPath, 'users.json')

subscribeObjectManager("users", {
    onRestore: () => {
        if (global.users) {
            return;
        }

        if (fs.existsSync(usersFilePath)) {
            logger.info("Loading users from persistence")
            global.users = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'))
        } else {
            logger.info("Initialize users")
            global.users = []
        }
    },
    onStore: () => {
        writeSafe(usersFilePath, JSON.stringify(global.users, null, 2))
    }
})

export function getUsers() {
    return global.users
}

export function getUserById(userId: string): User | undefined {
    return global.users.find(user => user.id === userId)
}

export function getUserByUsername(username: string): User | undefined {
    return global.users.find(user => user.username === username)
}

export function getUserOrThrow(userId: string) {
    const user = getUserById(userId)
    if(!user) {
        throw Error("User not found")
    }
    return user
}

export function registerNewUser(username: string) {
    const user: User = { id: generateId(username), username: username, avatar: "", team: "", isAdmin: false, ips: [] }
    global.users.push(user)
    return user
}

export function updateUser(userId: string, partialUser: Partial<User>) {
    let userIndex = global.users.findIndex(user => user.id == userId)
    if (userIndex != -1) {
        global.users[userIndex] = { ...global.users[userIndex], ...partialUser }
    }
}

function generateId(username:string) {
    return username.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}