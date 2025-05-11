import sharp from "sharp"
import { mkdir, rm } from 'fs/promises'
import { EventUpdateUsers } from "~/lib/emitter.server"
import { logErrorAndThrow, logger } from "~/lib/logging/logging"
import { hasPassword, resetPassword } from "~/lib/persistence/password.server"
import { getUserById, getUserByUsername, registerNewUser } from "~/lib/persistence/users.server"
import { requireUserAdmin } from "~/lib/session.server"


export async function resetUserPassword(request: Request, userId: string) {
    await requireUserAdmin(request)
    const user = getUserById(userId)
    if (!user) {
        logErrorAndThrow(`Impossible to reset password: unknown userId ${userId}`)
        return
    }
    if (hasPassword(userId)) {
        resetPassword(userId)
    }
    logger.info(`Password reset for user ${userId}`)
}

export async function renameUser(request: Request, userId: string, newUsername: string) {
    await requireUserAdmin(request)
    const user = getUserById(userId)
    if (!user) {
        logErrorAndThrow(`Impossible to rename: unknown userId ${userId}`)
        return
    }
    if (!newUsername || newUsername.length > 15) {
        logErrorAndThrow("Impossible to rename: invalid new username")
        return
    }

    const existingUser = getUserByUsername(newUsername)
    if (existingUser && existingUser.id != userId) {
        logErrorAndThrow(`Impossible to remane: username ${newUsername} is already used`)
        return
    }

    user.username = newUsername

    logger.info(`Renamed ${userId} to ${newUsername}`)
    EventUpdateUsers()
}

export async function addUsers(rawUsernames: string[]) {
    rawUsernames.forEach(rawUsername => {
        if (!rawUsername) return
        const username = rawUsername.trim()
        if (username.length > 15) {
            logErrorAndThrow(`Impossible to add ${username}: username is too long`)
            return
        }
        if (getUserByUsername(username)) {
            logErrorAndThrow(`Impossible to add ${username}: username already exists`)
            return
        }
        registerNewUser(username, false)
        logger.info(`New user ${username} created`)
    })
    EventUpdateUsers()
}

export async function setLanMap(file: File) {
    if (file.size > 5 * 1024 * 1024) {
        logErrorAndThrow(`An admin tried to upload a too big map (${file.size / (1024 * 1024)} MB)`)
    }
    const inputBuffer = Buffer.from(await file.arrayBuffer())

    await mkdir('uploads', { recursive: true })
    console.log("got image")
    try {
        await rm("uploads/lanMap.webp", {force: true})
        await sharp(inputBuffer).toFile("uploads/lanMap.webp")
    } catch (e) {
        console.error(e)
        throw e
    }
}