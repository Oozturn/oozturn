import { createContext, useContext } from "react"
import { Settings } from "~/lib/types/settings"

export const SettingsContext = createContext<Settings | null>(null)

export function useSettings() {
	const settings = useContext(SettingsContext)
	if (!settings) {
		throw new Error('useSettings must be used within a SettingsContext.Provider')
	}
	return settings
}