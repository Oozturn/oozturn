declare module 'tournament' {

    /** Id class, composed of s, r, m:
     *  - s: section
     *  - r: round
     *  - m: match
     */
    class Id {
        s: number; //section
        r: number; //round
        m: number; //match
    }

    /** Match class, composed of id, p, m:
     *  - id: Id
     *  - p: players array
     *  - m?: mapScore if score() has been called
     */
    class Match {
        id: Id;
        p: number[];
        m: number[] | undefined;
    }

    /** Result base class, conposed of:
     *  - pos: position in tournament. If not finished, minimal guaranteed position
     *  - seed: player seed
     *  - wins: number of wins in this tournament
     *  - for: total scored points
     *  - against: total concessed points (Duel) or total of diff between player and top player (FFA) 
     */
    class Result {
        pos: number
        seed: number
        wins: number
        for: number | undefined
        against: number | undefined
    }

    class Event {
        type: string
        id: Id
        score: number[]
    }

    /** Base tournament class */
    class Tournament {
        constructor(nb_players: number, options?: Any) { }

        /** list of tournament matches */
        matches: Match[]
        /**  */
        state: Event[]
        metadata: Any


        /** MATCHES */
        /** find match from its id */
        findMatch: (id: Id) => Match
        /** find matches corresponding to the partial id */
        findMatches: (idPartial: { s: number, r: number | undefined, m: number | undefined }) => Match[]
        /** check if a match has all its players and no mapScore */
        isPlayable: (match: Match) => boolean

        /** PLAYERS */
        /** get matches a player appears in */
        matchesFor: (seed: number) => Match[]
        /** returns the current result of the tournament, sorted by position. If not finished, .pos will be the minimal garanteed position for each player */
        results: () => Result[]

        /** PROGRESSION */
        /** defines a mapScore for specified match. If scoring is impossible, returns false */
        score: (matchId: Id, mapScore: number[]) => boolean
        /** gives the reason a match cannot be scored with this mapScore */
        unscorable: (matchId: Id, mapScore: number[], allowPast?: boolean) => string | null
        /** returns whether or not the tournament is finished */
        isDone: () => boolean

        /** SAVE */
        /** restores a stored tournament from its events */
        static restore<T extends typeof Tournament>(
            this: T,
            length: number,
            options: {},
            state: Event[],
            data?: Array
        ): InstanceType<T>;
    }
}

// TODO: eventually turn resAry into a ES6 Map
export let resultEntry = function (resAry, seed) {
    for (var i = 0; i < resAry.length; i += 1) {
        if (resAry[i].seed === seed) {
            return resAry[i];
        }
    }
    throw new Error('No result found for seed ' + seed + ' in result array:' + resAry);
};