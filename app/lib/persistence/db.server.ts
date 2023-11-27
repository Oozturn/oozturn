import { logger } from "~/lib/logging/logging"

interface DbObjectManager {
    onStore: () => void,
    onRestore: () => void
}

declare global {
    var diskPersistenceInterval: NodeJS.Timer
    var objectManagers: Map<string, DbObjectManager>;
}

const intervalPersistenceSeconds = 10

initialiseDiskPersistence()
setTimeout(fireRestore,1)

function initialiseDiskPersistence() {
    if (global.diskPersistenceInterval) {
        return
    }
    if (!global.objectManagers) {
        global.objectManagers = new Map<string, DbObjectManager>();
    }
    logger.info("Initialisation persistence interval")
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
}