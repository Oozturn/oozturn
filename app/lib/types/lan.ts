export interface Lan {
    name: string
    motd: string
    startDate: DateType
    endDate: DateType
    newUsersByAdminOnly: boolean
    authenticationNeeded: boolean
    globalTournamentDefaultPoints: globalTournamentPoints
    showPartialResults: boolean
    weightTeamsResults: boolean
    showTeamsResults: boolean
}

export interface DateType {
    day: number
    hour: number
    min: number
}

export interface globalTournamentPoints {
    leaders: number[]
    default: number
}