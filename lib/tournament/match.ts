import { firstBy, gt, compare, eq, unique } from './interlude/interlude'

export interface Id {
  s: number, //1-indexed
  r: number, //1-indexed
  m: number //1-indexed
}

/** Match class, composed of id, p, m:
 *  - id: Id
 *  - p: players array
 *  - m?: mapScore if score() has been called
 */
export interface Match {
  id: Id,
  p: number[], //1-indexed
  m?: number[]
  data?:any
}

var o = { NONE: 0 }; // no player marker same for all tournaments

export let findMatch = function (matches: Match[], id: Id) {
  return firstBy((m) => {
    return id.s === m.id.s && id.r === m.id.r && id.m === m.id.m;
  }, matches);
};

export let findMatches = function (matches: Match[], id: Partial<Id>) {
  return matches.filter((m) => {
    return (id.s == null || m.id.s === id.s) &&
      (id.r == null || m.id.r === id.r) &&
      (id.m == null || m.id.m === id.m);
  });
};

export let findMatchesRanged = function (matches: Match[], lb: Partial<Id>, ub?: Partial<Id>) {
  ub ||= {}
  return matches.filter((m) => {
    return (lb.s == null || m.id.s >= lb.s) &&
      (lb.r == null || m.id.r >= lb.r) &&
      (lb.m == null || m.id.m >= lb.m) &&
      (ub?.s == null || m.id.s <= ub.s) &&
      (ub?.r == null || m.id.r <= ub.r) &&
      (ub?.m == null || m.id.m <= ub.m);
  });
};

export let partitionMatches = function (matches: Match[], splitKey: keyof Id, filterKey: keyof Id, filterVal?: Number) {
  var res: Match[][] = [];
  for (var i = 0; i < matches.length; i += 1) {
    var m = matches[i];
    if (filterVal == null || m.id[filterKey] === filterVal) {
      if (!Array.isArray(res[m.id[splitKey] - 1])) {
        res[m.id[splitKey] - 1] = [];
      }
      res[m.id[splitKey] - 1].push(m);
    }
  }
  return res;
};

export let matchesForPlayer = function (matches: Match[], playerId: number) {
  return matches.filter((m) => {
    return m.p.indexOf(playerId) >= 0;
  });
};

export let players = function (matches: Match[]) {
  var ps = matches.reduce((acc: number[], m: Match) => {
    return acc.concat(m.p); // collect all players in given matches
  }, []);
  return unique(ps).filter(gt(o.NONE)).sort(compare());
};

// This may replace rounds in future versions
export let rounds = function (matches: Match[]) {
  return unique(matches.map(m => m.id.r)).sort(compare());
};

export let upcoming = function (matches: Match[], playerId: number) {
  return matches.filter((m) => {
    return m.p.indexOf(playerId) >= 0 && !m.m
  });
};

export let started = function (matches: Match[]) {
  return matches.some((m) => {
    return m.p.every(gt(o.NONE)) && m.m; // not an automatically scored match
  });
};

export let playable = function (m: Match) {
  return !m.p.some(eq(o.NONE));
};


