import { createContext, useContext } from "react";
import { Tournament, TournamentInfo } from "~/lib/types/tournaments";


export const TournamentsContext = createContext<TournamentInfo[]>([])
export const TournamentContext = createContext<Tournament | undefined>(undefined)

export function useTournaments() {
    const tournaments = useContext(TournamentsContext)
    if (!tournaments) {
        throw new Error('useTournaments must be used within a TournamentsContext.Provider')
    }
    return tournaments
}
export function useTournament() {
    const tournament = useContext(TournamentContext)
    if (!tournament) {
        throw new Error('useTournament must be used within a TournamentContext.Provider')
    }
    return tournament
}