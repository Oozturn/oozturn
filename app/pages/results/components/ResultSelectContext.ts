import { createContext, useContext } from "react"

export const ResultSelectContext = createContext<{
  setActiveResult: (name: string) => void
}>({
  setActiveResult: () => {}
})

export function useResultSelect() {
  return useContext(ResultSelectContext)
}
