

export enum AchievementType {

    // players

    tournamentWinner = "Tournament Winner",   // most won tournaments
    efficientWinner = "Efficient Winner",    // ratio wonTournaments/playedTournaments
    neverFirst = "L'éternel second", // most second places
    worstPlayerEver = "Worst Player Ever", // worst in global leaderboard
    chiefWinner = "Chief Winner",    // best ratio
    chiefLooser = "Chief Looser",    // worst ratio
    compulsivePlayer = "Compulsive Player",   // most played matches
    david = "David",  // wins against better seed
    // Duel
    underPressure = "Under Pressure",  // most second chances
    tryHarder = "Try Harder",  // most hard victories

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
}

export const AchievementDecriptors = new Map<AchievementType, string>([
    [AchievementType.tournamentWinner, "La chèvre."],
    [AchievementType.efficientWinner, "L'important, c'est de bien choisir ses combats."],
    [AchievementType.neverFirst, "Le faiseur de héros."],
    [AchievementType.worstPlayerEver, "Le meilleur dans son domaine."],
    [AchievementType.chiefWinner, "Un dueliste acharné."],
    [AchievementType.chiefLooser, "Le meilleur adversaire."],
    [AchievementType.compulsivePlayer, "L'accro."],
    [AchievementType.david, "Toujours sous-estimé, jamais égalé."],
    [AchievementType.underPressure, "C'était pas loin, hein ?"],
    [AchievementType.tryHarder, "GG, belle remontada."],
])

export const AchievementValueDecriptor = new Map<AchievementType, { valueDescription: string, valueUseBest: boolean }>([
    [AchievementType.tournamentWinner, { valueDescription: "Tournois gagnés", valueUseBest: true }],
    [AchievementType.efficientWinner, { valueDescription: "Ratio tournois gagnés/joués", valueUseBest: true }],
    [AchievementType.neverFirst, { valueDescription: "Secondes places", valueUseBest: true }],
    [AchievementType.worstPlayerEver, { valueDescription: "Points au classement global", valueUseBest: false }],
    [AchievementType.chiefWinner, { valueDescription: "Ratio victoires/défaites", valueUseBest: true }],
    [AchievementType.chiefLooser, { valueDescription: "Ratio victoires/défaites", valueUseBest: false }],
    [AchievementType.compulsivePlayer, { valueDescription: "Matchs joués", valueUseBest: true }],
    [AchievementType.david, { valueDescription: "Victoires contre des meilleurs joueurs", valueUseBest: true }],
    [AchievementType.underPressure, { valueDescription: "Finales depuis le looser bracket", valueUseBest: true }],
    [AchievementType.tryHarder, { valueDescription: "Tournois gagnés depuis le looser bracket", valueUseBest: true }],
])
