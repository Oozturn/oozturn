import { EventUpdateUsers } from "~/lib/emitter.server"
import { logger } from "~/lib/logging/logging"
import { hasPassword, resetPassword } from "~/lib/persistence/password.server"
import { getUserById, getUserByUsername, registerNewUser } from "~/lib/persistence/users.server"
import { requireUserAdmin } from "~/lib/session.server"


export async function resetUserPassword(request: Request, userId: string) {
    await requireUserAdmin(request)
    const user = getUserById(userId)
    if (!user) {
        logger.error(`Impossible to reset password: unknown userId ${userId}`)
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
        logger.error(`Impossible to rename: unknown userId ${userId}`)
        return
    }
    if (!newUsername || newUsername.length > 15) {
        logger.error("Impossible to rename: invalid new username")
        return
    }

    const existingUser = getUserByUsername(newUsername)
    if (existingUser && existingUser.id != userId) {
        logger.error(`Impossible to remane: username ${newUsername} is already used`)
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
            logger.error(`Impossible to add ${username}: username is too long`)
            return
        }
        if (getUserByUsername(username)) {
            logger.error(`Impossible to add ${username}: username already exists`)
            return
        }
        registerNewUser(username, false)
        logger.info(`New user ${username} created`)
    })
    EventUpdateUsers()
}