import { BracketResult, BracketSettings, BracketType } from "../tournamentEngine/types";
import { UserStats } from "../types/statistics";


export function statsSorter(a: UserStats, b: UserStats) {
	return (b.globalTournamentPoints - a.globalTournamentPoints)
		|| (b.wonTournaments - a.wonTournaments)
		|| (b.playedTournaments - a.playedTournaments)
		|| (b.pointsRatio - a.pointsRatio)
		|| (b.bestTournamentPosition - a.bestTournamentPosition)
}

export function resultsSorter(a: BracketResult, b: BracketResult, bSettings: BracketSettings) {
	const btype = bSettings.type
	const bScore = btype == BracketType.GroupStage ? b.wins * (bSettings.winPoints || 3) + (b.draws || 0) * (bSettings.tiePoints || 1) : 0
	const aScore = btype == BracketType.GroupStage ? a.wins * (bSettings.winPoints || 3) + (a.draws || 0) * (bSettings.tiePoints || 1) : 0
	return a.pos - b.pos
		|| bScore - aScore
		|| ((b.for || 0) - (b.against || 0)) - ((a.for || 0) - (a.against || 0))
		|| (b.for || 0) - (a.for || 0)
}