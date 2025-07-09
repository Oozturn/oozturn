import { replicate } from "./interlude/autonomy"
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

const makeMatches = function (numPlayers: number, groupSize: number, hasAway: boolean) {
    const groups = grouper(numPlayers, groupSize);
    const matches = [];
    for (let g = 0; g < groups.length; g += 1) {
        const group = groups[g];
        // make robin rounds for the group
        const rnds = robin(group.length, group);
        for (let r = 0; r < rnds.length; r += 1) {
            const rnd = rnds[r];
            for (let m = 0; m < rnd.length; m += 1) {
                const plsH = rnd[m];
                if (!hasAway) { // players only meet once
                    matches.push({ id: new Id(g + 1, r + 1, m + 1), p: plsH });
                }
                else { // players meet twice
                    const plsA = plsH.slice().reverse();
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
    private lowerScoreIsBetter: boolean
    private leftScoreBetterThanRight = (s1: number, s2: number) => s1 > s2

    constructor(numPlayers: number, opts: GroupStageOpts) {
        //init default
        opts.groupSize = Number(opts.groupSize) || numPlayers;
        opts.meetTwice = Boolean(opts.meetTwice);
        opts.winPoints = Number.isFinite(opts.winPoints) ? opts.winPoints : 3;
        opts.tiePoints = Number.isFinite(opts.tiePoints) ? opts.tiePoints : 1;
        opts.scoresBreak = Boolean(opts.scoresBreak);
        opts.lowerScoreIsBetter = opts.lowerScoreIsBetter || false
        //check params
        invalid(numPlayers, opts)

        //create matches
        const matches = makeMatches(numPlayers, opts.groupSize, opts.meetTwice);

        super('GroupStage', numPlayers, matches)
        this.numGroups = Math.max(...matches.map(it => it.id.s))
        this.groupSize = Math.ceil(numPlayers / this.numGroups); // perhaps reduced
        this.winPoints = opts.winPoints!;
        this.tiePoints = opts.tiePoints!;
        this.scoresBreak = opts.scoresBreak;
        this.lowerScoreIsBetter = opts.lowerScoreIsBetter
        if (this.lowerScoreIsBetter) {
            this.leftScoreBetterThanRight = (s1, s2) => s2 > s1
        }
    }

    //helper
    groupFor(playerId: number) {
        for (let i = 0; i < this.matches.length; i += 1) {
            const m = this.matches[i];
            if (m.p.indexOf(playerId) >= 0) {
                return m.id.s;
            }
        }
    }

    // no one-round-at-a-time restrictions so can always rescore
    protected safe(): boolean {
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
        const p0 = resultEntry(resAry, m.p[0]);
        const p1 = resultEntry(resAry, m.p[1]);

        if (m.m[0] === m.m[1]) {
            p0.pts += this.tiePoints;
            p1.pts += this.tiePoints;
            p0.draws += 1;
            p1.draws += 1;
        }
        else {
            const w = (this.leftScoreBetterThanRight(m.m[0], m.m[1])) ? p0 : p1;
            const l = (this.leftScoreBetterThanRight(m.m[0], m.m[1])) ? p1 : p0;
            w.wins += 1;
            w.pts += this.winPoints;
            l.losses += 1;
        }
        p0.matches += 1;
        p1.matches += 1;
        p0.for! += this.lowerScoreIsBetter ? m.m[1] : m.m[0];
        p1.for! += this.lowerScoreIsBetter ? m.m[0] : m.m[1];
        p0.against! += this.lowerScoreIsBetter ? m.m[0] : m.m[1];
        p1.against! += this.lowerScoreIsBetter ? m.m[1] : m.m[0];
        return resAry;
    }

    protected sort(resAry: Result[]): Result[] {
        const scoresBreak = this.scoresBreak;
        resAry.sort(this.compareResults);

        // tieCompute within groups to get the `gpos` attribute
        // at the same time build up array of xplacers
        const xarys: Result[][] = replicate(this.groupSize, () => []);
        resultsByGroup(resAry, this.numGroups).forEach((g) => { // g sorted as res is
            this.tieCompute(g, 0, scoresBreak, (r: Result, pos: number) => {
                r.gpos = pos;
                xarys[pos - 1].push(r);
            });
        });

        if (this.isDone()) {
            // position based entirely on x-placement (ignore pts/scorediff across grps)
            let posctr = 1;
            xarys.forEach(function (xplacers) {
                xplacers.forEach(function (r) {
                    r.pos = posctr;
                });
                posctr += xplacers.length;
            });
        }
        return resAry.sort(this.finalCompare); // ensure sorted by pos primarily
    }

    protected progress(): void {

    }

    private compareResults = (x: Result, y: Result) => {
        const xScore = x.for! - x.against!;
        const yScore = y.for! - y.against!;
        return (y.pts/y.matches - x.pts/x.matches) || (yScore/y.matches - xScore/x.matches) || (y.for!/y.matches - x.for!/x.matches) || (x.seed - y.seed);
    }

    private finalCompare = (x: Result, y: Result) => {
        return (x.pos - y.pos) || this.compareResults(x, y);
    }

    private tieCompute = (resAry: Result[], startPos: number, scoresBreak: boolean, cb: (r: Result, pos: number) => void) => {
        // provide the metric for resTieCompute which look factors: points and score diff
        resTieCompute(resAry, startPos, cb, (r: Result) => {
            let val = 'PTS' + r.pts;
            if (scoresBreak) {
                val += 'DIFF' + (r.for! - r.against!);
            }
            return val;
        });
    };
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
    const grps: Result[][] = replicate(numGroups, () => []);
    for (let k = 0; k < results.length; k += 1) {
        const p = results[k];
        grps[p.grp - 1].push(p);
    }
    return grps;
};