import { createContext, useContext } from "react"

export type Section = "lanSettings" | "tournamentsSettings" | "globalTournamentSettings" | "communicationSettings"

export const HightlightOpponentContext = createContext<{
    hightlightOpponent: string,
    setHightlightOpponent: React.Dispatch<React.SetStateAction<string>>
}>({
    hightlightOpponent: "",
    setHightlightOpponent: () => { }
});

export function useHightlightOpponent() {
    return useContext(HightlightOpponentContext)
}