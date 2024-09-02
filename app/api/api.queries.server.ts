import crypto from 'crypto'
import { mkdir, rm } from 'fs/promises'
import sharp from 'sharp'
import { EventUpdateUsers } from '~/lib/emitter.server'
import { getUserOrThrow } from '~/lib/persistence/users.server'

const AVATAR_FOLDER = "public/avatar"

export async function setAvatar(userId: string, file: File) {
    const user = getUserOrThrow(userId)
    const newAvatar = await storeAvatar(file)
    if (user.avatar) {
        await deleteOldAvatar(user.avatar)
    }
    user.avatar = newAvatar
    EventUpdateUsers()
}

export async function removeAvatar(userId: string) {
    const user = getUserOrThrow(userId)
    if (user.avatar) {
        await deleteOldAvatar(user.avatar)
    }
    user.avatar = ""
    EventUpdateUsers()
}

async function deleteOldAvatar(filename: string) {
    try {
        await rm(`${AVATAR_FOLDER}/${filename}`)
    } catch (e) {
        console.error(e)
    }
}

async function storeAvatar(file: File): Promise<string> {
    const inputBuffer = Buffer.from(await file.arrayBuffer())
    const hashSum = crypto.createHash('md5')
    hashSum.update(inputBuffer)
    const hex = hashSum.digest('hex')
    const filename = `${hex}.webp`
    await mkdir(AVATAR_FOLDER, { recursive: true })
    try {
        await sharp(inputBuffer, { animated: true, pages: -1 })
            .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toFile(`${AVATAR_FOLDER}/${filename}`)
    } catch (e) {
        console.error(e)
        throw e
    }
    return filename
}