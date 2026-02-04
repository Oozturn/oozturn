import { createContext, useContext } from "react"

export type Section =
  | "lanSettings"
  | "tournamentsSettings"
  | "globalTournamentSettings"
  | "communicationSettings"
  | "ongoingMatches"

export const AdminSectionContext = createContext<{
  setActiveSection: (section: Section) => void
  updateLan: (key: string, value: string) => void
}>({
  setActiveSection: () => {},
  updateLan: () => {}
})

export function useAdminSection() {
  return useContext(AdminSectionContext)
}
