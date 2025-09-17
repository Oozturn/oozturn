

export enum AchievementType {

    // players

    tournamentWinner = "achievements.tournamentWinner",   // most won tournaments
    efficientWinner = "achievements.efficientWinner",    // ratio wonTournaments/playedTournaments
    neverFirst = "achievements.neverFirst", // most second places
    worstPlayerEver = "achievements.worstPlayerEver", // worst in global leaderboard
    chiefWinner = "achievements.chiefWinner",    // best ratio
    chiefLooser = "achievements.chiefLooser",    // worst ratio
    compulsivePlayer = "achievements.compulsivePlayer",   // most played matches
    david = "achievements.david",  // wins against better seed
    // Duel
    underPressure = "achievements.underPressure",  // most second chances
    tryHarder = "achievements.tryHarder",  // most hard victories

    // teams

}

export interface Achievement {
    active: boolean
    type: AchievementType
    name: string
    description: string
    userId?: string
    valueDescription: string
    valueUseBest: boolean
    value?: number
    title?: string
}

export const AchievementDecriptors = new Map<AchievementType, string>([
    [AchievementType.tournamentWinner, "achievements.tournamentWinner_desc"],
    [AchievementType.efficientWinner, "achievements.efficientWinner_desc"],
    [AchievementType.neverFirst, "achievements.neverFirst_desc"],
    [AchievementType.worstPlayerEver, "achievements.worstPlayerEver_desc"],
    [AchievementType.chiefWinner, "achievements.chiefWinner_desc"],
    [AchievementType.chiefLooser, "achievements.chiefLooser_desc"],
    [AchievementType.compulsivePlayer, "achievements.compulsivePlayer_desc"],
    [AchievementType.david, "achievements.david_desc"],
    [AchievementType.underPressure, "achievements.underPressure_desc"],
    [AchievementType.tryHarder, "achievements.tryHarder_desc"],
])

export const AchievementValueDecriptor = new Map<AchievementType, { valueDescription: string, valueUseBest: boolean, title?: string }>([
    [AchievementType.tournamentWinner, { valueDescription: "achievements.tournamentWinner_value_desc", valueUseBest: true }],
    [AchievementType.efficientWinner, { valueDescription: "achievements.efficientWinner_value_desc", valueUseBest: true }],
    [AchievementType.neverFirst, { valueDescription: "achievements.neverFirst_value_desc", valueUseBest: true }],
    [AchievementType.worstPlayerEver, { valueDescription: "achievements.worstPlayerEver_value_desc", valueUseBest: false }],
    [AchievementType.chiefWinner, { valueDescription: "achievements.chiefWinner_value_desc", valueUseBest: true, title: "0, t'as pris tarif.\n1, t'as mis cher à ton adversaire." }],
    [AchievementType.chiefLooser, { valueDescription: "achievements.chiefLooser_value_desc", valueUseBest: false, title: "0, t'as pris tarif.\n1, t'as mis cher à ton adversaire." }],
    [AchievementType.compulsivePlayer, { valueDescription: "achievements.compulsivePlayer_value_desc", valueUseBest: true }],
    [AchievementType.david, { valueDescription: "achievements.david_value_desc", valueUseBest: true, title: "On regarde le seed.\nS'il est aléatoire bah... tant pis..." }],
    [AchievementType.underPressure, { valueDescription: "achievements.underPressure_value_desc", valueUseBest: true }],
    [AchievementType.tryHarder, { valueDescription: "achievements.tryHarder_value_desc", valueUseBest: true }],
])
