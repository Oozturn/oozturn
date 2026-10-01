import AdmZip from "adm-zip"
import { existsSync } from "fs"
import { EventUpdateUsers } from "~/lib/emitter.server"
import { logErrorAndThrow, logger } from "~/lib/logging/logging"
import { dbFolderPath, fireStore } from "~/lib/persistence/db.server"
import { getLan } from "~/lib/persistence/lan.server"
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
  rawUsernames.forEach((rawUsername) => {
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

const EXPORTED_FOLDERS = [dbFolderPath, "uploads"]

/** Local date and time of the export, as a filename safe `2024-03-16_21-07-42` */
function exportTimestamp() {
  const now = new Date()
  const pad2 = (value: number) => String(value).padStart(2, "0")
  const day = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
  const time = `${pad2(now.getHours())}-${pad2(now.getMinutes())}-${pad2(now.getSeconds())}`
  return `${day}_${time}`
}

/**
 * Builds a zip archive of the whole persisted state: the db json files and the uploaded pictures.
 * The in-memory state is flushed first so the archive is up to date.
 */
export async function exportData(request: Request): Promise<{ filename: string; content: Buffer }> {
  await requireUserAdmin(request)
  try {
    fireStore()
    const zip = new AdmZip()
    for (const folder of EXPORTED_FOLDERS) {
      if (!existsSync(folder)) {
        logger.warn(`Data export: skipping missing folder ${folder}`)
        continue
      }
      // ignore .tmp files
      zip.addLocalFolder(folder, folder, (name) => !name.endsWith(".tmp"))
    }
    const content = zip.toBuffer()
    const lanName = getLan().name.replace(/[^a-zA-Z0-9-_]+/g, "_")
    logger.info(`Data export: ${zip.getEntryCount()} entries, ${content.length} bytes`)
    return { filename: `${lanName}_${exportTimestamp()}.zip`, content }
  } catch (error) {
    logger.error(error)
    throw new Error("Impossible de générer la sauvegarde des données")
  }
}
