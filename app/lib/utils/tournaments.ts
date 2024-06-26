import { Id } from "../tournamentEngine/tournament/match"

export function GetFFAMaxPlayers(opponents: number[], advancers: number[]) {
  if (!opponents) return 0
  if (opponents.length != advancers.length + 1) return 0
  let maxPlayers = opponents[opponents.length - 1]
  for (let i = opponents.length - 2; i >= 0; i--) {
    maxPlayers = maxPlayers / advancers[i] * opponents[i]
  }
  return maxPlayers
}


export function IdToString(id: Id): string {
  return id.s + '.' + id.r + '.' + id.m
}
export function StringToId(str: string): Id {
  const [s, r, m] = str.split('.')
  return {s: Number(s), r:Number(r), m:Number(m)}
}