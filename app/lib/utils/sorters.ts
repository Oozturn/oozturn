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
	const score = (res: BracketResult) => {return btype == BracketType.GroupStage ? (res.wins * 3 + (res.draws || 0) * 1) : 0}
	const diff = (res: BracketResult) => {return (res.for || 0) - (res.against || 0)}
	return a.pos - b.pos
		|| score(b) - score(a)
		|| diff(b) - diff(a)
		|| (b.for || 0) - (a.for || 0)
}