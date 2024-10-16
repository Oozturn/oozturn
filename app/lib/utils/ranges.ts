import { UserStats } from "../types/statistics"

export function range(start: number, stop: number, step: number) {
  return Array.from(
    { length: (stop - start) / step + 1 },
    (value, index) => start + index * step
  )
}

export const Days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]


export function usingStats(a: UserStats, b: UserStats) {
  return (b.globalTournamentPoints - a.globalTournamentPoints)
  || (b.wonTournaments - a.wonTournaments)
  || (b.playedTournaments - a.playedTournaments)
  || (b.pointsRatio - a.pointsRatio)
  || (b.bestTournamentPosition - a.bestTournamentPosition)
}