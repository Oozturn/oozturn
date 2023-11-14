declare module 'ffa' {
    import { Tournament, Id } from 'tournament';
    
    class FFA extends Tournament {
        
        /** Creates a new FFA.
         *  - nb_players: number. *At least 2 players needed*
         *  - options:
         *      - sizes?: number[]. *Set the size of matches at each round. If not specified, will generate a single match of nb_players opponents*
         *      - advancers?: number[]. *Set the number of opponents qualifieds for next round. Must be of size.lenght-1 lenght*
         *      - limit?: number. *Players winning last match. If not set, default is 1* 
         */
        constructor(nb_players: number, options?: {sizes?: number[], advancers?: number[], limit?: number}) {}
    }
}
