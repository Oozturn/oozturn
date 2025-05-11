import { EventEmitter } from "node:events"
import { EVENT_SERVER_ERROR, EVENT_UPDATE_LAN, EVENT_UPDATE_TOURNAMENT, EVENT_UPDATE_TOURNAMENTS, EVENT_UPDATE_USERS, serverErrorEventProps, TOURNAMENT_UPDATE_TYPES, tournamentUpdateEventProps } from "./events/types"

export const emitter = new EventEmitter()

export function EventStartTournament(tournamentId: string) {
    emitter.emit(EVENT_UPDATE_TOURNAMENT, <tournamentUpdateEventProps>{updateType: TOURNAMENT_UPDATE_TYPES.START,  tournamentId: tournamentId})
}
export function EventEndTournament(tournamentId: string) {
    emitter.emit(EVENT_UPDATE_TOURNAMENT, <tournamentUpdateEventProps>{updateType: TOURNAMENT_UPDATE_TYPES.END,  tournamentId: tournamentId})
}
export function EventNewTournament(tournamentId: string) {
    emitter.emit(EVENT_UPDATE_TOURNAMENT, <tournamentUpdateEventProps>{updateType: TOURNAMENT_UPDATE_TYPES.NEW,  tournamentId: tournamentId})
}
export function EventUpdateTournamentInfo(tournamentId: string) {
    emitter.emit(EVENT_UPDATE_TOURNAMENT, <tournamentUpdateEventProps>{updateType: TOURNAMENT_UPDATE_TYPES.UPDATE_INFO,  tournamentId: tournamentId})
}
export function EventUpdateTournamentBracket(tournamentId: string) {
    emitter.emit(EVENT_UPDATE_TOURNAMENT, <tournamentUpdateEventProps>{updateType: TOURNAMENT_UPDATE_TYPES.UPDATE_BRACKET,  tournamentId: tournamentId})
}
export function EventUpdateTournamentSettings(tournamentId: string) {
    emitter.emit(EVENT_UPDATE_TOURNAMENT, <tournamentUpdateEventProps>{updateType: TOURNAMENT_UPDATE_TYPES.UPDATE_SETTINGS,  tournamentId: tournamentId})
}
export function EventUpdateTournaments() {
    emitter.emit(EVENT_UPDATE_TOURNAMENTS)
}
export function EventUpdateLan() {
    emitter.emit(EVENT_UPDATE_LAN)
}
export function EventUpdateUsers() {
    emitter.emit(EVENT_UPDATE_USERS)
}
export function EventServerError(userId: string, error: string) {
    emitter.emit(EVENT_SERVER_ERROR, <serverErrorEventProps>{userId: userId, error: error})
}
