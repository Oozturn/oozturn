import { logger } from "~/lib/logging/logging"
import { dbFolderPath, subscribeObjectManager } from "./db.server"
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
        fs.writeFileSync(usersFilePath, JSON.stringify(global.users, null, 2), 'utf-8')
    }
})

export function getUsers() {
    return global.users
}

export function getUser(username: string) {
    return global.users.find(user => user.username == username)
}

export function registerNewUser(username: string) {
    const user: User = { username: username, avatar: "", team: "", isAdmin: false, ips: [] }
    global.users.push(user)
    return user
}

export function updateUser(username: string, partialUser: Partial<User>) {
    let userIndex = global.users.findIndex(user => user.username == username)
    if (userIndex != -1) {
        global.users[userIndex] = { ...global.users[userIndex], ...partialUser }
    }
}