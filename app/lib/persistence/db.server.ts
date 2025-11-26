import * as fs from "fs"
import { logger } from "~/lib/logging/logging"

interface DbObjectManager {
  onStore: () => void
  onRestore: () => void
}

declare global {
  // eslint-disable-next-line no-var
  var diskPersistenceInterval: NodeJS.Timer
  // eslint-disable-next-line no-var
  var objectManagers: Map<string, DbObjectManager>
}

export const dbFolderPath = "db"
const intervalPersistenceSeconds = 10

initialiseDiskPersistence()
setTimeout(fireRestore, 1)

function initialiseDiskPersistence() {
  if (global.diskPersistenceInterval) {
    return
  }
  logger.info(`Persistence initialization`)
  if (!global.objectManagers) {
    logger.info(`Persistence initialization - Loading objects managers`)
    global.objectManagers = new Map<string, DbObjectManager>()
  }
  if (!fs.existsSync(dbFolderPath)) {
    logger.info(`Persistence initialization - Creating DB folder ${dbFolderPath}`)
    fs.mkdir(dbFolderPath, { recursive: true }, (err) => {
      if (err) throw err
    })
  }
  logger.info(`Persistence initialization - interval set to ${intervalPersistenceSeconds} seconds.`)
  global.diskPersistenceInterval = setInterval(fireStore, intervalPersistenceSeconds * 1000)
}

function fireRestore() {
  global.objectManagers.forEach((objectManager) => {
    objectManager.onRestore()
  })
}

function fireStore() {
  global.objectManagers.forEach((objectManager) => {
    objectManager.onStore()
  })
}

export function subscribeObjectManager(id: string, objectManager: DbObjectManager) {
  objectManagers.set(id, objectManager)
  objectManager.onRestore()
}

export function writeSafe(filepath: string, content: string) {
  const tmpPath = filepath + ".tmp"
  fs.writeFileSync(tmpPath, content, "utf-8")
  fs.renameSync(tmpPath, filepath)
}
