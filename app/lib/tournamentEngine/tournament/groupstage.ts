import { replicate } from "./interlude/autonomy"
import { insert } from "./interlude/interlude"
import { Match } from "./match"
import { group as grouper } from "./scheduling/group"
import { robin } from "./scheduling/robin"
import { compareMatches, Result as BaseResult, resultEntry, Tournament, Id as TournamentId, TournamentOpts, resTieCompute } from "./tournament"

interface Result extends BaseResult {
    gpos: number
    grp: number
    losses: number
    draws: number
    pts: number
}

/** Id class, composed of g, r, m:
 *  - g: group
 *  - r: round
 *  - m: match
 */
class Id implements TournamentId {
    s: number
    r: number
    m: number

    constructor(group: number, round: number, match: number) {
        this.s = group
        this.r = round
        this.m = match
    }

    toString() {
        return 'G' + this.s + ' R' + this.r + ' M' + this.m;
    }
}


// ------------------------------------------------------------------

const mapOdd = function (n: number) {
    return n * 2 - 1;
};
const mapEven = function (n: number) {
    return n * 2;
};

var makeMatches = function (numPlayers: number, groupSize: number, hasAway: boolean) {
    var groups = grouper(numPlayers, groupSize);
    var matches = [];
    for (var g = 0; g < groups.length; g += 1) {
        var group = groups[g];
        // make robin rounds for the group
        var rnds = robin(group.length, group);
        for (var r = 0; r < rnds.length; r += 1) {
            var rnd = rnds[r];
            for (var m = 0; m < rnd.length; m += 1) {
                var plsH = rnd[m];
                if (!hasAway) { // players only meet once
                    matches.push({ id: new Id(g + 1, r + 1, m + 1), p: plsH });
                }
                else { // players meet twice
                    var plsA = plsH.slice().reverse();
                    matches.push({ id: new Id(g + 1, mapOdd(r + 1), m + 1), p: plsH });
                    matches.push({ id: new Id(g + 1, mapEven(r + 1), m + 1), p: plsA });
                }
            }
        }
    }
    return matches.sort(compareMatches);
};

// ------------------------------------------------------------------

export interface GroupStageOpts extends TournamentOpts {
    groupSize?: number
    winPoints?: number
    tiePoints?: number
    scoresBreak?: boolean
    meetTwice?: boolean
}

export class GroupStage extends Tournament {
    private numGroups: number
    private groupSize: number
    private winPoints: number
    private tiePoints: number
    private scoresBreak: boolean

    constructor(numPlayers: number, opts: GroupStageOpts) {
        //init default
        opts.groupSize = Number(opts.groupSize) || numPlayers;
        opts.meetTwice = Boolean(opts.meetTwice);
        opts.winPoints = Number.isFinite(opts.winPoints) ? opts.winPoints : 3;
        opts.tiePoints = Number.isFinite(opts.tiePoints) ? opts.tiePoints : 1;
        opts.scoresBreak = Boolean(opts.scoresBreak);
        //check params
        invalid(numPlayers, opts)

        //create matches
        var matches = makeMatches(numPlayers, opts.groupSize, opts.meetTwice);

        super('GroupStage', numPlayers, matches)
        this.numGroups = Math.max(...matches.map(it => it.id.s))
        this.groupSize = Math.ceil(numPlayers / this.numGroups); // perhaps reduced
        this.winPoints = opts.winPoints!;
        this.tiePoints = opts.tiePoints!;
        this.scoresBreak = opts.scoresBreak;
    }

    //helper
    groupFor(playerId: number) {
        for (var i = 0; i < this.matches.length; i += 1) {
            var m = this.matches[i];
            if (m.p.indexOf(playerId) >= 0) {
                return m.id.s;
            }
        }
    }

    // helper method to be compatible with TieBreaker
    rawPositions(resAry: Result[]) {
        return resultsByGroup(resAry, this.numGroups).map((grp) => {
            // NB: need to create the empty arrays to let result function as a lookup
            var seedAry: number[][] = replicate(grp.length, () => []);
            for (var k = 0; k < grp.length; k += 1) {
                var p = grp[k];
                insert(seedAry[p.gpos - 1], p.seed); // insert ensures ascending order
            }
            return seedAry;
        });
    };

    // no one-round-at-a-time restrictions so can always rescore
    protected safe(match: Match): boolean {
        return true
    }

    protected initResult(seed: number) {
        return {
            grp: this.groupFor(seed),
            gpos: this.groupSize,
            pts: 0,
            draws: 0,
            losses: 0
        };
    }

    protected stats(resAry: Result[], m: Match): Result[] {
        if (!m.m) {
            return resAry;
        }
        var p0 = resultEntry(resAry, m.p[0]);
        var p1 = resultEntry(resAry, m.p[1]);

        if (m.m[0] === m.m[1]) {
            p0.pts += this.tiePoints;
            p1.pts += this.tiePoints;
            p0.draws += 1;
            p1.draws += 1;
        }
        else {
            var w = (m.m[0] > m.m[1]) ? p0 : p1;
            var l = (m.m[0] > m.m[1]) ? p1 : p0;
            w.wins += 1;
            w.pts += this.winPoints;
            l.losses += 1;
        }
        p0.for! += m.m[0];
        p1.for! += m.m[1];
        p0.against! += m.m[1];
        p1.against! += m.m[0];
        return resAry;
    }

    protected sort(resAry: Result[]): Result[] {
        var scoresBreak = this.scoresBreak;
        resAry.sort(compareResults);

        // tieCompute within groups to get the `gpos` attribute
        // at the same time build up array of xplacers
        var xarys: Result[][] = replicate(this.groupSize, () => []);
        resultsByGroup(resAry, this.numGroups).forEach(function (g) { // g sorted as res is
            tieCompute(g, 0, scoresBreak, (r: Result, pos: number) => {
                r.gpos = pos;
                xarys[pos - 1].push(r);
            });
        });

        if (this.isDone()) {
            // position based entirely on x-placement (ignore pts/scorediff across grps)
            var posctr = 1;
            xarys.forEach(function (xplacers) {
                xplacers.forEach(function (r) {
                    r.pos = posctr;
                });
                posctr += xplacers.length;
            });
        }
        return resAry.sort(finalCompare); // ensure sorted by pos primarily
    }

    protected progress(match: Match): void {

    }
}

const invalid = function (np: number, opts: GroupStageOpts) {
    if (np < 2) {
        throw new Error('numPlayers cannot be less than 2');
    }
    if (opts.groupSize! < 2) {
        throw new Error('groupSize cannot be less than 2');
    }
    if (opts.groupSize! > np) {
        throw new Error('groupSize cannot be greater than numPlayers');
    }
    return null;
}

const resultsByGroup = function (results: Result[], numGroups: number) {
    var grps: Result[][] = replicate(numGroups, () => []);
    for (var k = 0; k < results.length; k += 1) {
        var p = results[k];
        grps[p.grp - 1].push(p);
    }
    return grps;
};

const tieCompute = function (resAry: Result[], startPos: number, scoresBreak: boolean, cb: (r: Result, pos: number) => void) {
    // provide the metric for resTieCompute which look factors: points and score diff
    resTieCompute(resAry, startPos, cb, function metric(r: Result) {
        var val = 'PTS' + r.pts;
        if (scoresBreak) {
            val += 'DIFF' + (r.for! - r.against!);
        }
        return val;
    });
};

const compareResults = function (x: Result, y: Result) {
    var xScore = x.for! - x.against!;
    var yScore = y.for! - y.against!;
    return (y.pts - x.pts) || (yScore - xScore) || (x.seed - y.seed);
};

const finalCompare = function (x: Result, y: Result) {
    return (x.pos - y.pos) || compareResults(x, y);
};


