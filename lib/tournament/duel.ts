import { even, gt, odd } from "./interlude/interlude";
import { Match } from "./match";
import { Result, StateElt, Tournament, Id as TournamentId, resultEntry } from "./tournament";

const WB = 1
  , LB = 2
  , WO = -1
  , NONE = 0;


// shortcut to create a match id as duel tourneys are very specific about locations
let gId = function (b: number, r: number, m: number) {
  return new Id(b, r, m);
};

// make ALL matches for a Duel elimination tournament
let elimination = function (size: number, p: number, last: number, isLong: boolean) {
  let matches: Match[] = [];
  // first WB round to initialize players
  for (let i = 1; i <= Math.pow(2, p - 1); i += 1) {
    matches.push({ id: gId(WB, 1, i), p: woMark(seeds(i, p), size) });
  }

  // blank WB rounds
  var r, g;
  for (r = 2; r <= p; r += 1) {
    for (g = 1; g <= Math.pow(2, p - r); g += 1) {
      matches.push({ id: gId(WB, r, g), p: blank() });
    }
  }

  // blank LB rounds
  if (last >= LB) {
    for (r = 1; r <= 2 * p - 2; r += 1) {
      // number of matches halves every odd round in losers bracket
      for (g = 1; g <= Math.pow(2, p - 1 - Math.floor((r + 1) / 2)); g += 1) {
        matches.push({ id: gId(LB, r, g), p: blank() });
      }
    }
    matches.push({ id: gId(LB, 2 * p - 1, 1), p: blank() }); // grand final match 1
  }
  if (isLong) {
    // bronze final if last === WB, else grand final match 2
    matches.push({ id: gId(LB, last === LB ? 2 * p : 1, 1), p: blank() });
  }
  // sort so they can be scored in order
  return matches.sort((g1, g2) => {
    return (g1.id.s - g2.id.s) || (g1.id.r - g2.id.r) || (g1.id.m - g2.id.m);
  });
}

// get initial players for match i in a power p duel tournament
// NB: match number i is 1-indexed - VERY UNDEFINED for i<=0
let seeds = function (i: number, p: number): [number, number] {
  var even = evenSeed(i, p);
  return [Math.pow(2, p) + 1 - even, even];
};

// helpers to initialize duel tournaments
// http://clux.org/entries/view/2407
let evenSeed = function (i: number, p: number) {
  var k = Math.floor(Math.log(i) / Math.log(2))
    , r = i - Math.pow(2, k);
  if (r === 0) {
    return Math.pow(2, p - k);
  }
  var nr = (i - 2 * r).toString(2).split('').reverse().join('');
  return (parseInt(nr, 2) << p - nr.length) + Math.pow(2, p - k - 1);
};

// mark players that had to be added to fit model as WO's
let woMark = function (ps: [number, number], size: number) {
  return ps.map(function (p) {
    return (p > size) ? WO : p;
  });
};

var blank = function () {
  return [NONE, NONE];
};

let lbPos = function (p: number, maxr: number) {
  // model position as y = 2^(k+1) + c_k2^k + 1
  // where k(maxr) = floor(roundDiff/2)
  // works upto and including LB final (gf players must be positioned manually)
  var metric = 2 * p - maxr;
  var k = Math.floor(metric / 2) - 1; // every other doubles
  if (k < 0) {
    throw new Error('lbPos model works for k>=0 only');
  }
  var ck = Math.pow(2, k) * (metric % 2);
  return Math.pow(2, k + 1) + 1 + ck;
};

let wbPos = function (p: number, maxr: number) {
  // similar but simpler, double each round, and note that ties are + 1
  // works up to and including semis (WBF + BF must be positioned manually)
  return Math.pow(2, p - maxr) + 1;
};

let placement = function (last: number, p: number, maxr: number) {
  return (last === LB) ? lbPos(p, maxr) : wbPos(p, maxr);
};

// helper to mix down progression to reduce chances of replayed matches
let mixLbGames = function (p: number, round: number, game: number) {
  // we know round <= p
  var numGames = Math.pow(2, p - round);
  var midPoint = Math.floor(Math.pow(2, p - round - 1)); // midPoint 0 in finals

  // reverse the match list map
  var reversed = odd(Math.floor(round / 2));
  // split the match list map in two change order and rejoin the lists
  var partitioned = even(Math.floor((round + 1) / 2));

  if (partitioned) {
    if (reversed) {
      return (game > midPoint) ? numGames - game + midPoint + 1 : midPoint - game + 1;
    }
    return (game > midPoint) ? game - midPoint : game + midPoint;
  }
  return reversed ? numGames - game + 1 : game;
};

/** Id class, composed of s, r, m:
 *  - s: section
 *  - r: round
 *  - m: match
 */
class Id implements TournamentId {
  s: number;
  r: number;
  m: number;

  constructor(bracket: number, round: number, match: number) {
    this.s = bracket;
    this.r = round;
    this.m = match;
  }

  toString() {
    return (this.s === WB ? 'WB' : 'LB') + ' R' + this.r + ' M' + this.m;
  };
}

interface DuelOpts {
  short?: boolean,
  last?: number,
  downMix?: boolean,
  lowerScoreIsBetter?: boolean
}

export class Duel extends Tournament {
  static WB = WB
  static LB = LB
  static WO = WO
  private isLong: boolean;
  private last: number;
  private downMix: boolean;
  private p: number;
  private lowerScoreIsBetter: boolean;
  private scoreComparator: (m1: number, m2: number) => boolean

  static restore(numPlayers: number, opts: DuelOpts, state: StateElt[], data?: { id: Id, data: any }[]) {
    var trn = new Duel(numPlayers, opts);
    // score the tournament from the valid score calls in state that we generate
    state.forEach(function (o) {
      if (o.type === 'score') {
        trn.score(o.id, o.score);
      }
    });
    // also re-attach match data to the appropriate matches if passed in
    // user is responsible for sanity checking what they put on each match.data
    (data || []).forEach(function (d) {
      trn.findMatch(d.id).data = d.data;
    });
    return trn;
  };

  /** Creates a new Duel.
 *  - nb_players: from 4 to 1024, optimal number is a power of two
 *  - options:
 *      - last?: set to Duel.LB for double elimination
 *      - short?: if set to true,
 *          - removes bronze final (3 and 4 are tied in 3rd place)
 *          - removes double grand final in double elimination (winner of LB can win grand final in one match)
 */
  constructor(numPlayers: number, opts: DuelOpts) {
    //init default
    opts.last = opts.last || WB;
    opts.lowerScoreIsBetter = opts.lowerScoreIsBetter || false
    //check params
    let isLong = !opts.short;
    if ((!isLong && numPlayers < 2) || (isLong && numPlayers < 4) || numPlayers > 1024) {
      throw new Error('numPlayers must be >= ' + (isLong ? 4 : 2) + ' and <= 1024')
    }
    if ([WB, LB].indexOf(opts.last) < 0) {
      throw new Error('last elimination bracket must be either WB or LB')
    }

    //create matches
    let p = Math.ceil(Math.log(numPlayers) / Math.log(2));
    let matches = elimination(numPlayers, p, opts.last, isLong)

    super("Duel", numPlayers, matches)
    this.isLong = isLong; // isLong for WB => hasBF, isLong for LB => hasGf2
    this.last = opts.last;
    this.downMix = opts.downMix! && opts.last > WB
    this.p = p;
    this.lowerScoreIsBetter = opts.lowerScoreIsBetter;
    this.scoreComparator = opts.lowerScoreIsBetter ? (m1: number, m2: number) => m1 < m2 : (m1: number, m2: number) => m1 > m2

    var scorer = this.woScore.bind(this, this.progress.bind(this));
    this.findMatches({ s: WB, r: 1 }).forEach(scorer);
    if (this.last > WB) {
      this.findMatches({ s: LB, r: 1 }).forEach(scorer);
    }
  }

  protected progress(match: Match): void {
    // 1. calculate winner and loser for progression
    var w = (this.scoreComparator(match.m![0], match.m![1])) ? match.p[0] : match.p[1]
      , l = (this.scoreComparator(match.m![0], match.m![1])) ? match.p[1] : match.p[0];
    // in double elimination, the double final should be propagated to with zeroes
    // unless we actually need it (underdog won gfg1 forcing the gfg2 decider)
    var isShortLbGf = (match.id.s === LB && match.id.r === 2 * this.p - 1 && this.isLong);
    if (isShortLbGf && w === match.p[0]) {
      w = l = 0;
    }
    // 2. move winner right
    // NB: non-WO match `id` cannot `right` into a WOd match => discard res
    this.inserter(this.right(match.id), w);

    // 3. move loser down if applicable
    var dres = this.inserter(this.down(match.id), l);

    // 4. check if loser must be forwarded from existing WO in LBR1/LBR2
    // NB: propagateZeroes is never relevant as LBR2 is always before GF1 when p >= 2
    if (dres) {
      this.inserter(this.right(dres), l);
    }
  }

  protected verify(match: Match, score: number[]): string | null {
    if (match.p[0] === WO || match.p[1] === WO) {
      return "cannot override score in walkover'd match";
    }
    if (score[0] === score[1]) {
      return 'cannot draw a duel';
    }
    return null;
  }

  protected safe(match: Match): boolean {
    // ensure matches [right, down, down ∘ right] are all unplayed (ignoring WO)
    var r = this.right(match.id)
      , d = this.down(match.id)
      , rm = r && this.findMatch(r[0])
      , dm = d && this.findMatch(d[0])
      , dr = dm && this.right(dm.id) // right from down
      , drm = dr && this.findMatch(dr[0]);

    return [rm, dm, drm].every(function (next) {
      // safe iff (match not there, or unplayed, or contains WO markers)
      return !next || !next.m || next.p[0] === WO || next.p[1] === WO;
    });
  }

  protected early(): boolean {
    var gf1 = this.matches[this.matches.length - 2];
    return this.isLong && this.last === LB && gf1.m! && this.scoreComparator(gf1.m[0], gf1.m[1]);
  }

  protected stats(res: Result[], g: Match): Result[] {
    var isLong = this.isLong
      , last = this.last
      , p = this.p
      , isBf = isLong && last === WB && g.id.s === LB
      , isWbGf = last === WB && g.id.s === WB && g.id.r === p
      , isLbGfs = last === LB && g.id.s === LB && g.id.r >= 2 * p - 1
      , isLongSemi = isLong && last === WB && g.id.s === WB && g.id.r === p - 1
      , canPosition = !isBf && !isWbGf && !isLbGfs && !isLongSemi
      , maxr = (g.id.s < last) ? this.down(g.id)![0].r : g.id.r;

    // position players based on reaching the match
    g.p.filter(gt(0)).forEach(function (s) {
      resultEntry(res, s).pos = canPosition ?
        placement(last, p, maxr) : // estimate from minimally achieved last round
        2 + Number(isBf || isLongSemi) * 2; // finals are 2 or 4 initially
    });

    // compute stats for played matches - ignore WOs (then p found in next)
    if (g.p.indexOf(WO) < 0 && g.m) {
      // when we have scores, we have a winner and a loser
      var p0 = resultEntry(res, g.p[0])
        , p1 = resultEntry(res, g.p[1])
        , w = this.scoreComparator(g.m[0], g.m[1]) ? p0 : p1;

      // inc wins
      w.wins += 1;
      p0.for! += g.m[0];
      p1.for! += g.m[1];
      p0.against! += g.m[1];
      p1.against! += g.m[0];

      // bump winners of finals
      var wbWinnerWon = p0.seed === w.seed;
      var isConclusiveLbGf = isLbGfs && (g.id.r === 2 * p || !isLong || wbWinnerWon);
      if (isBf || isWbGf || isConclusiveLbGf) {
        w.pos -= 1;
      }
    }
    return res;
  }

  // find the match and position a winner should move "right" to in the current bracket
  public right(id: Id): [Id, number] | null {
    var b = id.s
      , r = id.r
      , g = id.m
      , p = this.p;

    // cases where progression stops for winners
    var isFinalSe = (this.last === WB && r === p)
      , isFinalDe = (this.last === LB && b === LB && r === 2 * p)
      , isBronze = (this.last === WB && b === LB)
      , isShortLbGf = (b === LB && r === 2 * p - 1 && !this.isLong);

    if (isFinalSe || isFinalDe || isBronze || isShortLbGf) {
      return null;
    }

    // special case of WB winner moving to LB GF G1
    if (this.last >= LB && b === WB && r === p) {
      return [gId(LB, 2 * p - 1, 1), 0];
    }

    // for LB positioning
    var ghalf = (b === LB && odd(r)) ? g : Math.floor((g + 1) / 2);

    var pos;
    if (b === WB) {
      pos = (g + 1) % 2; // normal WB progression
    }
    // LB progression
    else if (r >= 2 * p - 2) {
      pos = (r + 1) % 2; // LB final winner -> bottom & GF(1) underdog winner -> top
    }
    else if (r === 1) {
      // unless downMix, LBR1 winners move inversely to normal progression
      pos = this.downMix ? 1 : g % 2;
    }
    else {
      // winner from LB always bottom in odd rounds, otherwise normal progression
      pos = odd(r) ? 1 : (g + 1) % 2;
    }

    // normal progression
    return [gId(b, r + 1, ghalf), pos];
  };

  // find the match and position a loser should move "down" to in the current bracket
  public down(id: Id): [Id, number] | null {
    var b = id.s
      , r = id.r
      , g = id.m
      , p = this.p;

    // knockouts / special finals
    if (b >= this.last) { // greater than case is for BF in long single elimination
      if (b === WB && this.isLong && r === p - 1) {
        // if bronze final, move loser to "LBR1" at mirror pos of WBGF
        return [gId(LB, 1, 1), (g + 1) % 2];
      }
      if (b === LB && r === 2 * p - 1 && this.isLong) {
        // if double final, then loser moves to the bottom
        return [gId(LB, 2 * p, 1), 1];
      }
      // otherwise always KO'd if loosing in >= last bracket
      return null;
    }

    // WBR1 always feeds into LBR1 as if it were WBR2
    if (r === 1) {
      return [gId(LB, 1, Math.floor((g + 1) / 2)), g % 2];
    }

    if (this.downMix) {
      // always drop on top when downmixing
      return [gId(LB, (r - 1) * 2, mixLbGames(p, r, g)), 0];
    }

    // normal  LB drops: on top for (r>2) and (r<=2 if odd g) to match bracket movement
    var pos = (r > 2 || odd(g)) ? 0 : 1;
    return [gId(LB, (r - 1) * 2, g), pos];
  }

  // given a direction (one of the above two), move an 'advancer' to that location
  private inserter(progress: [Id, number] | null, adv: number) {
    if (progress) {
      var id = progress[0]
        , pos = progress[1]
        , insertM = this.findMatch(id);

      if (!insertM) {
        throw new Error('tournament corrupt: ' + id + ' not found!');
      }

      insertM.p[pos] = adv;
      if (insertM.p[(pos + 1) % 2] === WO) {
        insertM.m = (pos) ? [0, 1] : [1, 0]; // set WO map scores
        return insertM.id; // this id was won by adv on WO, inform
      }
    }
  };

  // helper to initially score matches with walkovers correctly
  private woScore(progressFn: (match: Match) => void, m: Match) {
    var idx = m.p.indexOf(WO);
    if (idx >= 0) {
      // set scores manually to avoid the `_verify` walkover scoring restriction
      m.m = (idx === 0) ? [0, 1] : [1, 0];
      if (this.lowerScoreIsBetter) {
        m.m = m.m.reverse()
      }
      progressFn(m);
    }
  };
}

