import { rm } from 'fs/promises'
import { EventUpdateUsers } from '~/lib/emitter.server'
import { logErrorAndThrow, logger } from '~/lib/logging/logging'
import { getUserOrThrow } from '~/lib/persistence/users.server'
import { storePicture } from '~/lib/utils/storeImage'

const AVATAR_FOLDER = "uploads/avatar"

export async function setAvatar(userId: string, file: File) {
    const user = getUserOrThrow(userId)
    if (file.size > 3 * 1024 * 1024) {
        logErrorAndThrow(`User ${userId} tried to upload a too big avatar (${file.size / (1024 * 1024)} MB)`)
    }
    const newAvatar = await storePicture(file, AVATAR_FOLDER)
    if (user.avatar) {
        await deleteOldAvatar(user.avatar)
    }
    user.avatar = newAvatar
    logger.debug(`Set avatar ${newAvatar} to user ${userId}`)
    EventUpdateUsers()
}

export async function removeAvatar(userId: string) {
    const user = getUserOrThrow(userId)
    if (user.avatar) {
        await deleteOldAvatar(user.avatar)
    }
    user.avatar = ""
    logger.debug(`Removed avatar for user ${userId}`)
    EventUpdateUsers()
}

async function deleteOldAvatar(filename: string) {
    try {
        await rm(`${AVATAR_FOLDER}/${filename}`)
    } catch (e) {
        logger.error(e)
    }
}