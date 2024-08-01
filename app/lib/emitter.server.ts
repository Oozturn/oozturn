import { EventEmitter } from "node:events"

export const EMITTER_GLOBAL_TOURNAMENT_UPDATE = "globalTournamentUpdate"
export const EMITTER_NOTIFICATION_MESSAGE = "notificationMessage"

export const emitter = new EventEmitter()

let index = 0
const userId = ["will", "rnd"]

/** Juste pour lancer pendant le dev en attendant d'avoir de vrai evenements */
setInterval(() => {
    index = (index+1)%2
    emitter.emit(EMITTER_GLOBAL_TOURNAMENT_UPDATE, {emitter:userId[index]})
    emitter.emit(EMITTER_NOTIFICATION_MESSAGE, {content:userId[index]})
}, 30000)