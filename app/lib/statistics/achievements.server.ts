import { getLan } from "../persistence/lan.server";
import { Achievement, AchievementDecriptors, AchievementType, AchievementValueDecriptor } from "../types/achievements";
import { UserStats } from "../types/statistics";
import { getStats } from "./statistics.server";


function getAchievementUser(achievement: AchievementType) {
    let userStats: UserStats
    switch (achievement) {
        case AchievementType.tournamentWinner:
            userStats = getStats().usersStats.sort((a, b) => b.wonTournaments - a.wonTournaments)[0]
            if (userStats.wonTournaments == 0) break
            return { userId: userStats.userId, value: userStats.wonTournaments}
        case AchievementType.efficientWinner:
            userStats = getStats().usersStats.sort((a, b) => b.wonTournaments / b.playedTournaments - a.wonTournaments / a.playedTournaments)[0]
            if (userStats.wonTournaments == 0) break
            return { userId: userStats.userId, value: userStats.wonTournaments / userStats.playedTournaments}
        case AchievementType.neverFirst:
            userStats = getStats().usersStats.sort((a, b) => b.secondPlaces - a.secondPlaces)[0]
            if (userStats.secondPlaces == 0) break
            return { userId: userStats.userId, value: userStats.secondPlaces}
        case AchievementType.worstPlayerEver:
            userStats = getStats().usersStats.sort((a, b) => a.globalTournamentPoints - b.globalTournamentPoints)[0]
            return { userId: userStats.userId, value: userStats.globalTournamentPoints}
        case AchievementType.chiefWinner:
            userStats = getStats().usersStats.sort((a, b) => b.winLossMeanRatio - a.winLossMeanRatio)[0]
            if (userStats.winLossMeanRatio == 0) break
            return { userId: userStats.userId, value: userStats.winLossMeanRatio}
        case AchievementType.chiefLooser:
            userStats = getStats().usersStats.sort((a, b) => a.winLossMeanRatio - b.winLossMeanRatio)[0]
            return { userId: userStats.userId, value: userStats.winLossMeanRatio}
        case AchievementType.compulsivePlayer:
            userStats = getStats().usersStats.sort((a, b) => b.playedMatches - a.playedMatches)[0]
            if (userStats.playedMatches == 0) break
            return { userId: userStats.userId, value: userStats.playedMatches}
        case AchievementType.david:
            userStats = getStats().usersStats.sort((a, b) => b.winsAgainstBetterSeed - a.winsAgainstBetterSeed)[0]
            if (userStats.winsAgainstBetterSeed == 0) break
            return { userId: userStats.userId, value: userStats.winsAgainstBetterSeed}
        case AchievementType.underPressure:
            userStats = getStats().usersStats.sort((a, b) => b.secondChances - a.secondChances)[0]
            if (userStats.secondChances == 0) break
            return { userId: userStats.userId, value: userStats.secondChances}
        case AchievementType.tryHarder:
            userStats = getStats().usersStats.sort((a, b) => b.hardVictories - a.hardVictories)[0]
            if (userStats.hardVictories == 0) break
            return { userId: userStats.userId, value: userStats.hardVictories}

        default:
            break
    }
    return { userId: undefined, value: undefined}
}

export function getAchievements(): Achievement[] {
    const lanAchievements = getLan().achievements
    return Object.values(AchievementType).map(achievementType => {
        const achievementUser = getAchievementUser(achievementType)
        return {
            active: lanAchievements.find(a => a.type == achievementType)?.active || false,
            type: achievementType,
            name: lanAchievements.find(a => a.type == achievementType)?.name || achievementType,
            description: lanAchievements.find(a => a.type == achievementType)?.description || AchievementDecriptors.get(achievementType) || "",
            userId: achievementUser.userId,
            value: achievementUser.value,
            ... (AchievementValueDecriptor.get(achievementType) || {valueDescription: "", valueUseBest: true})
        }
    })
}