import next from "next/types";
import { compare, firstBy, flatten, gt, insert, maximum, replicate, zip } from "./interlude/interlude";
import { Match } from "./match";
import { group, minimalGroupSize } from "./scheduling/group";
import { NONE, Result as BaseResult, StateElt, Tournament, Id as TournamentId, compareZip, isInteger, matchTieCompute, resultEntry, sorted, compareZipReversed } from "./tournament";

//------------------------------------------------------------------
// Initialization helpers
//------------------------------------------------------------------

let unspecify = function (grps: number[][]) {
  return grps.map((grp) => {
    return replicate(grp.length, () => NONE);
  });
};

let makeMatches = function (np: number, grs: number[], adv: number[]): Match[] {
  var matches = []; // pushed in sort order
  // rounds created iteratively - know configuration valid at this point so just
  // repeat the calculation in the validation
  for (var i = 0; i < grs.length; i += 1) {
    var a = adv[i]
      , gs = grs[i]
      , numGroups = Math.ceil(np / gs)
      , grps = group(np, gs);

    if (numGroups !== grps.length) {
      throw new Error('internal FFA construction error');
    }
    if (i > 0) {
      // only fill in seeding numbers for round 1, otherwise placeholders
      grps = unspecify(grps);
    }

    // fill in matches
    for (var m = 0; m < grps.length; m += 1) {
      matches.push({ id: mId(i + 1, m + 1), p: grps[m] }); // matches 1-indexed
    }
    // reduce players left (for next round - which will exist if a is defined)
    np = numGroups * a;
  }
  return matches;
};

//------------------------------------------------------------------
// Invalid helpers
//------------------------------------------------------------------

let roundInvalid = function (np: number, grs: number, adv: number, numGroups: number) {
  // the group size in here refers to the maximal reduced group size
  if (np < 2) {
    return 'needs at least 2 players';
  }
  if (grs < 2) {
    return 'group size must be at least 2';
  }
  if (adv >= grs) {
    return 'must advance less than the group size';
  }
  var isUnfilled = (np % numGroups) > 0;
  if (isUnfilled && adv >= grs - 1) {
    return 'must advance less than the smallest match size';
  }
  if (adv <= 0) {
    return 'must eliminate players each match';
  }
  return null;
};

let finalInvalid = function (leftOver: number, limit: number, gLast: number) {
  if (leftOver < 2) {
    return 'must contain at least 2 players'; // force >4 when using limits
  }
  var lastNg = Math.ceil(leftOver / gLast);
  if (limit > 0) { // using limits
    if (limit >= leftOver) {
      return 'limit must be less than the remaining number of players';
    }
    // need limit to be a multiple of numGroups (otherwise tiebreaks necessary)
    if (limit % lastNg !== 0) {
      return 'number of matches must divide limit';
    }
  }
  return null;
};

let invalid = function (np: number, grs: number[], adv: number[], limit: number) {
  if (np < 2) {
    throw new Error('number of players must be at least 2');
  }
  if (!grs.length || !grs.every(isInteger)) {
    throw new Error('sizes must be a non-empty array of integers');
  }
  if (!adv.every(isInteger) || grs.length !== adv.length + 1) {
    throw new Error('advancers must be a sizes.length-1 length array of integers');
  }

  var numGroups = 0;
  for (var i = 0; i < adv.length; i += 1) {
    // loop over adv as then both a and g exist
    var a = adv[i];
    var g = grs[i];
    // calculate how big the groups are
    numGroups = Math.ceil(np / g);
    var gActual = minimalGroupSize(np, g);

    // and ensure with group reduction that eliminationValid for reduced params
    var invReason = roundInvalid(np, gActual, a, numGroups);
    if (invReason !== null) {
      return 'round ' + (i + 1) + ' ' + invReason;
    }
    // return how many players left so that np is updated for next itr
    np = numGroups * a;
  }
  // last round and limit checks
  var invFinReason = finalInvalid(np, limit, grs[grs.length - 1]);
  if (invFinReason !== null) {
    return 'final round ' + invFinReason;
  }

  // nothing found - ok to create
  return null;
};


let mId = function (r: number, m: number) {
  return new Id(r, m);
};

//------------------------------------------------------------------
// Class
//------------------------------------------------------------------

interface Result extends BaseResult {
  gpos:number
}

class Id implements TournamentId {
  s: number;
  r: number;
  m: number;

  constructor(r: number, m: number) {
    this.s = 1;
    this.r = r;
    this.m = m;
  }

  toString() {
    return 'R' + this.r + ' M' + this.m;
  };
}

interface FFAOpts {
  limit?: number;
  advancers?: number[];
  sizes?: number[];
  lowerScoreIsBetter?:boolean;
}

export class FFA extends Tournament {
  private limit: number;
  private advs: number[];
  private sizes: number[];
  private compareScore:(z1: [number, number], z2: [number, number]) => number;
  private lowerScoreIsBetter: boolean;
  
  constructor(numPlayers: number, opts: FFAOpts) {
    //init default
    opts.limit = opts.limit || 0;
    opts.sizes = Array.isArray(opts.sizes) ? opts.sizes : [numPlayers];
    opts.advancers = Array.isArray(opts.advancers) ? opts.advancers : [];
    opts.lowerScoreIsBetter = opts.lowerScoreIsBetter || false;
    //check params
    invalid(numPlayers, opts.sizes, opts.advancers, opts.limit);

    //create matches
    let matches = makeMatches(numPlayers, opts.sizes, opts.advancers)

    super('FFA', numPlayers, matches)
    this.limit = opts.limit;
    this.advs = opts.advancers;
    this.sizes = opts.sizes;
    this.compareScore = opts.lowerScoreIsBetter ? compareZipReversed : compareZip;
    this.lowerScoreIsBetter = opts.lowerScoreIsBetter
      }

  static restore(numPlayers:number, opts:FFAOpts, state:StateElt[], data?:{id:Id, data:any}[]) {
    var trn = new FFA(numPlayers, opts);
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

  limbo(playerId: number) {
    // if player reached currentRound, he may be waiting for generation of nextRound
    var m = firstBy((g) => {
      return (g.p.indexOf(playerId) >= 0 && g.m) as boolean;
    }, this.currentRound() || []);

    if (m) {
      // will he advance to nextRound ?
      var adv = this.advs[m.id.r - 1];
      if (sorted(m).slice(0, adv).indexOf(playerId) >= 0) {
        return { s: 1, r: m.id.r + 1 }; // TODO: no toString representation for this
      }
    }
  }

  protected progress(match: Match): void {
    var adv = this.advs[match.id.r - 1] || 0;
    var currRnd = this.findMatches({ r: match.id.r });
    if (currRnd.every(it => it.m) && adv > 0) {
      this.prepRound(currRnd, this.findMatches({ r: match.id.r + 1 }), adv);
    }
  }

  protected safe(match: Match): boolean {
    var nextRnd = this.findMatches({ r: match.id.r + 1 });
    // safe iff next round has not started
    return nextRnd.every(function (m) {
      return !Array.isArray(m.m);
    });
  }

  protected verify(match: Match, score: number[]): string | null {
    var adv = this.advs[match.id.r - 1] || 0;
    var sortedScore = score.slice().sort(compare()).reverse();
    if (this.lowerScoreIsBetter) {
      sortedScore.reverse()
    }
    if (adv > 0 && adv < sortedScore.length && sortedScore[adv] === sortedScore[adv - 1]) {
      return 'scores must unambiguous decide who advances';
    }
    if (!adv && this.limit > 0) {
      // number of groups in last round is the match number of the very last match
      // because of the ordering this always works!
      var lastNG = this.matches[this.matches.length - 1].id.m;
      var cutoff = this.limit / lastNG; // NB: lastNG divides limit (from finalInvalid)
      if (sortedScore[cutoff] === sortedScore[cutoff - 1]) {
        return 'scores must decide who advances in final round with limits';
      }
    }
    return null;
  }

  protected stats(resAry: Result[], m: Match): Result[] {
    if (m.m) {
      var adv = this.advs[m.id.r - 1] || 0;
      zip(m.p, m.m).sort(this.compareScore).forEach(function (t, j, top) {
        var p = resultEntry(resAry, t[0]);
        p.for! += t[1];
        p.against! += (Math.abs(top[0][1] - t[1])); // difference with winner
        if (j < adv) {
          p.wins += 1;
        }
      });
    }
    return resAry;
  }

  protected sort(resAry: Result[]): Result[] {

    var limit = this.limit;
    var advs = this.advs;
    var sizes = this.sizes;
    var maxround = this.sizes.length;

    // gradually improve scores for each player by looking at later and later rounds
    this.rounds().forEach((rnd, k) => {
      var rndPs = flatten(rnd.map(it => it.p)).filter(gt(NONE));
      rndPs.forEach(function (p) {
        resultEntry(resAry, p).pos = rndPs.length; // tie players that got here
      });

      var isFinal = (k === maxround - 1);
      var adv = advs[k] || 0;
      var wlim = (limit > 0 && isFinal) ? limit / rnd.length : adv;
      var nonAdvancers:Result[][] = replicate(sizes[k] - adv, () => []); // all in final
      // collect non-advancers - and set wins
      rnd.filter(it => it.m).forEach((m) => {
        var startIdx = isFinal ? 0 : adv;
        var top = zip(m.p, m.m!).sort(this.compareScore).slice(startIdx);
        matchTieCompute(top, startIdx, function (p, pos) {
          var resEl = resultEntry(resAry, p);
          if (pos <= wlim || (pos === 1 && !adv)) {
            resEl.wins += 1;
          }
          if (isFinal) {
            resEl.gpos = pos; // for rawPositions
          }
          nonAdvancers[pos - adv - 1].push(resEl);
        });
      });

      // nonAdvancers will be tied between the round based on their mpos
      var posctr = adv * rnd.length + 1;
      nonAdvancers.forEach((xplacers) => {
        xplacers.forEach(function (r) {
          r.pos = posctr;
        });
        posctr += xplacers.length;
      });
    });

    return resAry.sort(compareMulti);
  }

  rawPositions(res:Result[]) {
    if (!this.isDone()) {
      throw new Error('cannot tiebreak a FFA tournament until it is finished');
    }
    var maxround = this.sizes.length;
    var finalRound = this.findMatches({ r: maxround });
    var posAry = finalRound.map(function (m) {
      var seedAry = replicate(m.p.length, () => []);
      m.p.forEach(function (p) {
        var resEl = resultEntry(res, p);
        insert(seedAry[(resEl.gpos || resEl.pos) - 1], p);
      });
      return seedAry;
    });
    return posAry;

  }

  prepRound(currRnd:Match[], nxtRnd:Match[], adv:number) {
    var rawTop = currRnd.map((m) => {
      return zip(m.p, m.m!).sort(this.compareScore).slice(0, adv);
    });
  
    // now flatten and sort across matches
    // this essentially re-seeds players for the next round
    var top = flatten(rawTop).sort(this.compareScore).map(it => it[0]);
  
    // re-find group size from maximum length of zeroed player array in next round
    var grs = maximum(nxtRnd.map(it => it.p.length))
  
    // set all next round players with the fairly grouped set
    group(top.length, grs).forEach((group, k) => {
      // replaced nulled out player array with seeds mapped to corr. top placers
      nxtRnd[k].p = group.map((seed) => {
        return top[seed - 1]; // NB: top is zero indexed
      });
    });
  };
}


var compareMulti = function (x:Result, y:Result) {
  return (x.pos - y.pos) ||
    ((y.for! - y.against!) - (x.for! - x.against!)) ||
    (x.seed - y.seed);
};


