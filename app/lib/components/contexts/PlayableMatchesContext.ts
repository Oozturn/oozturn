import { createContext, useContext } from "react"
import { PlayableMatch } from "~/lib/tournamentEngine/types"


export const AllPlayableMatchesContext = createContext<PlayableMatch[]>([])
export const PlayableMatchesContext = createContext<PlayableMatch[]>([])

export function useAllPlayableMatches() {
    const allPlayableMatches = useContext(AllPlayableMatchesContext)
    if (!allPlayableMatches) {
        throw new Error('useAllPlayableMatches must be used within a AllPlayableMatchesContext.Provider')
    }
    return allPlayableMatches
}
export function usePlayableMatches() {
    const playableMatches = useContext(PlayableMatchesContext)
    if (!playableMatches) {
        throw new Error('usePlayableMatches must be used within a PlayableMatchesContext.Provider')
    }
    return playableMatches
}