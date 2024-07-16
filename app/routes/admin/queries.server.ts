import { logger } from "~/lib/logging/logging"
import { hasPassword, resetPassword } from "~/lib/persistence/password.server"
import { getUserById, getUserByUsername, registerNewUser } from "~/lib/persistence/users.server"
import { requireUserAdmin } from "~/lib/session.server"


export async function resetUserPassword(request: Request, userId: string) {
    await requireUserAdmin(request)
    if (!userId) {
        logger.error("[resetUserPassword] Missing userId")
    }
    if (hasPassword(userId)) {
        logger.error(`[resetUserPassword] Reseting password of ${userId}`)
        resetPassword(userId)
    } else {
        logger.error(`[resetUserPassword] ${userId} without password`)
    }
}

export async function renamePlayer(request:Request, userId:string, newUsername:string) {
    await requireUserAdmin(request)
    if (!userId) {
        logger.error("[renamePlayer] Missing userId")
        return
    }
    if (!newUsername) {
        logger.error("[renamePlayer] Missing newUsername")
        return
    }

    const existingUser = getUserByUsername(newUsername)
    if(existingUser && existingUser.id != userId) {
        logger.error("[renamePlayer] Username taken")
        return
    }

    const user = getUserById(userId)
    user!.username = newUsername

    logger.error(`[renamePlayer] Renaming ${userId} to ${newUsername}`)
}

export async function addUsers(rawUsernames: string[]) {
    rawUsernames.forEach(rawUsername => {
        if (!rawUsername) return
        const username = rawUsername.trim()
        if (username.length > 15) {
            logger.error(`[AddUsers] username ${username} is too long`)
            return
        }
        if (getUserByUsername(username)) {
            logger.error(`[AddUsers] username ${username} already exists`)
            return
        }
        registerNewUser(username)
        logger.info(`[AddUsers] New user ${username} created`)
    })
}