

export const EVENT_UPDATE_TOURNAMENT = "eventUpdateTournament"
export const EVENT_UPDATE_TOURNAMENTS = "eventUpdateTournaments"
export const EVENT_UPDATE_LAN = "eventUpdateLan"
export const EVENT_UPDATE_USERS = "eventUpdateUsers"
export const EVENT_SERVER_ERROR = "eventServerError"

export interface tournamentUpdateEventProps {
    updateType: TOURNAMENT_UPDATE_TYPES
    tournamentId: string
}
export interface serverErrorEventProps {
    userId: string,
    error: string
}
export interface notificationProps {
    time: string
    messageType: "startTournament" | "endTournament" | "error"
    data: string
}

export enum TOURNAMENT_UPDATE_TYPES {
    START = "startTournament",
    END = "endTournament",
    NEW = "newTournament",
    UPDATE_INFO = "updateTournamentInfo",
    UPDATE_SETTINGS = "updateTournamentSettings",
    UPDATE_BRACKET = "updateTournamentBracket"
}