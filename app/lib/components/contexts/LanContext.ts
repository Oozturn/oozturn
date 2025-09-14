import { createContext, useContext } from "react"
import { Lan } from "~/lib/types/lan"

export const LanContext = createContext<Lan | null>(null)

export function useLan() {
  const lan = useContext(LanContext)
  if (!lan) {
    throw new Error("useLan must be used within a LanContext.Provider")
  }
  return lan
}
