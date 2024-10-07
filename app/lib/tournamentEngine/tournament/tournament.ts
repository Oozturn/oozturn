import { Match, findMatch, findMatches, findMatchesRanged, matchesForPlayer, partitionMatches, playable, players, upcoming, Id } from './match'
import { firstBy, zip } from './interlude/interlude'

/** Result base class, conposed of:
 *  - pos: position in tournament. If not finished, minimal guaranteed position
 *  - seed: player seed
 *  - wins: number of wins in this tournament
 *  - for: total scored points
 *  - against: total concessed points (Duel) or total of diff between player and top player (FFA) 
 */
export interface Result {
  seed: number
  wins: number
  for?: number
  against?: number
  pos: number
}

export interface StateElt {
  type: 'score' | 'next' | 'done'
  id?: Id
  score?: number[]
}

export interface TournamentOpts {
  lowerScoreIsBetter?: boolean
}

export abstract class Tournament {
  protected name: string
  /** list of tournament matches */
  public matches: Match[]
  public state: StateElt[]
  private numPlayers: number
  protected opts!: TournamentOpts

  constructor(name: string, numPlayers: number, ms: Match[]) {
    this.name = name
    this.matches = ms
    this.state = []
    this.numPlayers = numPlayers
  }

  protected early() {
    return false
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected verify(match: Match, score: number[]): string | null {
    return null
  }

  protected idToString(id: Id) {
    return (id + '' === '[object Object]') ?
      'S' + id.s + ' R' + id.r + ' M' + id.m :
      id + ''
  }

  protected abstract progress(match: Match): void

  protected abstract safe(match: Match): boolean


  protected sort(resAry: Result[]) {
    return resAry.sort((r1, r2) => {
      return (r1.pos - r2.pos) || (r1.seed - r2.seed)
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected stats(resAry: Result[], m: Match) {
    return resAry
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected initResult(seed: number) {
    return {}
  }

  /** returns whether or not the tournament is finished */
  isDone() {
    return this.matches.every((m) => m.m || this.early())
  }

  /** gives the reason a match cannot be scored with this mapScore */
  unscorable(id: Id, score: number[], allowPast: boolean) {
    const m = this.findMatch(id)
    if (!m) {
      return this.idToString(id) + ' not found in tournament'
    }
    if (!this.isPlayable(m)) {
      return this.idToString(id) + ' not ready - missing players'
    }
    if (!Array.isArray(score) || !score.every(Number.isFinite)) {
      return this.idToString(id) + ' scores must be a numeric array'
    }
    if (score.length !== m.p.length) {
      return this.idToString(id) + ' scores must have length ' + m.p.length
    }
    // if allowPast - you can do anything - but if not, it has to be safe
    if (!allowPast && Array.isArray(m.m) && !this.safe(m)) {
      return this.idToString(id) + ' cannot be re-scored'
    }
    return this.verify(m, score)
  }

  /** defines a mapScore for specified match. If scoring is impossible, returns false */
  score(id: Id, score: number[]) {
    const invReason = this.unscorable(id, score, true)
    if (invReason !== null) {
      console.error('failed scoring match %s with %j', this.idToString(id), score)
      console.error('reason:', invReason)
      return false
    }
    const m = this.findMatch(id)
    m.m = score
    this.state.push({ type: 'score', id: id, score: score })
    this.progress(m)
    return true
  }

  /** returns the current result of the tournament, sorted by position. If not finished, .pos will be the minimal garanteed position for each player */
  results() {
    const players = this.players()
    if (this.numPlayers !== players.length) {
      const why = players.length + ' !== ' + this.numPlayers
      throw new Error(this.name + ' initialized numPlayers incorrectly: ' + why)
    }

    const res: Result[] = new Array(this.numPlayers)
    for (let s = 0; s < this.numPlayers; s += 1) {
      // res is no longer sorted by seed initially
      res[s] = {
        seed: players[s],
        wins: 0,
        for: 0,
        against: 0,
        pos: this.numPlayers
      }
      res[s] = { ...res[s], ...this.initResult(players[s]) }
    }

    this.matches.reduce(this.stats.bind(this), res)
    return this.sort(res)
  }

  resultsFor(seed: number) {
    return firstBy((result: Result) => {
      return result.seed === seed
    }, this.results())
  }

  upcoming(playerId: number) {
    return upcoming(this.matches, playerId)
  }

  /** check if a match has all its players and no mapScore */
  isPlayable = playable

  /** find match from its id */
  findMatch(id: Id) {
    const m = findMatch(this.matches, id)
    if (!m) {
      throw new Error(`Match with id ${this.idToString(id)} could not be found`)
    }
    return m
  }

  /** find matches corresponding to the partial id */
  findMatches(id: Partial<Id>) {
    return findMatches(this.matches, id)
  }

  findMatchesRanged(lb: Partial<Id>, ub: Partial<Id>) {
    return findMatchesRanged(this.matches, lb, ub)
  }

  // partition matches into rounds (optionally fix section)
  rounds(section?: number) {
    return partitionMatches(this.matches, 'r', 's', section)
  }

  sections(round: number) {
    return partitionMatches(this.matches, 's', 'r', round)
  }

  private roundNotDone(round: Match[]) {
    return round.some((m: Match) => !m.m)
  }

  currentRound(section?: number) {
    return firstBy(this.roundNotDone, this.rounds(section))
  }

  nextRound(section: number) {
    const rounds = this.rounds(section)
    for (let i = 0; i < rounds.length; i += 1) {
      if (this.roundNotDone(rounds[i])) {
        return rounds[i + 1]
      }
    }
  }

  /** get matches a player appears in */
  matchesFor(playerId: number) {
    return matchesForPlayer(this.matches, playerId)
  }

  players(id?: Id) {
    return players(this.findMatches(id || {}))
  }
}

export type { Id } from './match'

// TODO: eventually turn resAry into a ES6 Map
export const resultEntry = function <T extends Result>(resAry: T[], seed: number): T {
  for (let i = 0; i < resAry.length; i += 1) {
    if (resAry[i].seed === seed) {
      return resAry[i]
    }
  }
  throw new Error('No result found for seed ' + seed + ' in result array:' + resAry)
}

export const sorted = function (m: Match) {
  return zip(m.p, m.m!).sort(compareZip).map(it => it[0])
}

// ensures first matches first and (for most part) forEach scorability
// similarly how it's read in many cases: WB R2 G3, G1 R1 M1
export const compareMatches = function (g1: { id: Id }, g2: { id: Id }) {
  return (g1.id.s - g2.id.s) || (g1.id.r - g2.id.r) || (g1.id.m - g2.id.m);
};

// internal sorting of zipped player array with map score array : zip(m.p, m.m)
// sorts by map score desc, then seed asc
export const compareZip = function (z1: [number, number], z2: [number, number]) {
  return (z2[1] - z1[1]) || (z1[0] - z2[0])
}

// internal sorting of zipped player array with map score array : zip(m.p, m.m)
// sorts by map score asc, then seed asc
export const compareZipReversed = function (z1: [number, number], z2: [number, number]) {
  return (z1[1] - z2[1]) || (z1[0] - z2[0])
}

// until this gets on Number in ES6
export const isInteger = function (n: number) {
  return Math.ceil(n) === n
}

// tie position an individual match by passing in a slice of the
// zipped players and scores array, sorted by compareZip
export const matchTieCompute = function (zipSlice: [number, number][], startIdx: number, callback: (p: number, pos: number) => void) {
  let pos = startIdx
    , ties = 0
    , scr = -Infinity

  // loop over players in order of their score
  for (let k = 0; k < zipSlice.length; k += 1) {
    const pair = zipSlice[k]
      , p = pair[0]
      , s = pair[1]

    // if this is a tie, pos is previous one, and next real pos must be incremented
    if (scr === s) {
      ties += 1
    }
    else {
      pos += 1 + ties; // if we tied, must also + that
      ties = 0
    }
    scr = s
    callback(p, pos); // user have to find resultEntry himself from seed
  }
}

// tie position an assumed sorted resAry using a metric fn
// the metric fn must be sufficiently linked to the sorting fn used
export const resTieCompute = function <M, R>(resAry: R[], startPos: number, cb: (r: R, pos: number) => void, metric: (r: R) => M) {
  let pos = startPos
    , ties = 0
    , points: M | number = -Infinity;

  for (let i = 0; i < resAry.length; i += 1) {
    const r = resAry[i];
    const metr = metric(r);

    if (metr === points) {
      ties += 1;
    }
    else {
      pos += ties + 1;
      ties = 0;
    }
    points = metr;
    cb(r, pos);
  }
};

export const NONE = 0