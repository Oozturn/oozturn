import { createContext, useContext } from "react"
import { Game } from "~/lib/types/games"


export const GamesContext = createContext<Game[] | undefined>(undefined)

export function useGames() {
    const games = useContext(GamesContext)
    if (!games) {
        throw new Error('useGames must be used within a GamesContext.Provider')
    }
    return games
}