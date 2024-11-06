import { createContext, useContext } from "react"
import { Statistics } from "~/lib/types/statistics"

export const StatsContext = createContext<Statistics | undefined>(undefined)

export function useStats() {
    const stats = useContext(StatsContext)
    if (!stats) {
        throw new Error('useStats must be used within a StatsContext.Provider')
    }
    return stats
}