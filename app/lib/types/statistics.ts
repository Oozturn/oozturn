export interface UserStats {
    userId: string
    wonTournaments: number
    secondPlaces: number
    globalTournamentPoints: number
    bestTournamentPosition: number
    pointsRatio: number
    playedTournaments: number
    playedMatches: number
    winsAgainstBetterSeed: number
    // Duels only
    LBWonMatches: number
    secondChances: number // From LB to final
    hardVictories: number // From LB to victory
}

export interface TeamStats {
    teamName: string
    members: number
    globalTournamentPoints: number
    weightedGlobalTournamentPoints: number
    playedTournaments: number
}

export interface LanStats {
    tournaments: number
    matches: number
    heats: number
    users: number
    avatars: number
}

export interface Statistics {
    usersStats: UserStats[]
    teamsStats: TeamStats[]
    lanStats: LanStats
    timestamp: number
}