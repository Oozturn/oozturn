import { globalTournamentSettings } from "./tournaments"

export interface Lan {
    name: string,
    motd: string,
    startDate: DateType
    endDate: DateType
    options: LanOptions
}

export interface DateType {
    day: number
    hour: number
    min: number
}

export interface LanOptions {
    globalTournamentDefaultSettings: globalTournamentSettings,
    weightTeamsResults: boolean
    partialResults: boolean
}