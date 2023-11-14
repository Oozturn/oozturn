import { BracketProperties } from "../__generated__/gql/types";

export function range(start: number, stop: number, step: number){
  return Array.from(
    {length: (stop - start) / step + 1},
    (value, index) => start + index * step
  );
}

export const Days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]


export function removeNulls(obj: any): any {
  if (typeof obj === 'object') {
      for (let key in obj) {
          obj[key] = removeNulls(obj[key]);
      }
  }
  return obj;
}

export function GetFFAMaxPlayers(opponents: number[], advancers: number[]) {
  if(!opponents) return 0
  if(opponents.length != advancers.length + 1) return 0
  let maxPlayers = opponents[opponents.length - 1]
  for (let i = opponents.length - 2; i >= 0; i--) {
    maxPlayers = maxPlayers / advancers[i] * opponents[i]
  }
  return maxPlayers
}