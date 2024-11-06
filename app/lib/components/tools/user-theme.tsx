
import useLocalStorageState from "use-local-storage-state"
import { accentsList, modesList } from "../data/themes"
import { useEffect } from "react"

export function GetUserTheme() {
	const [modeLocalStorage] = useLocalStorageState("mode", { defaultValue: "Dark" })
	const [accentLocalStorage] = useLocalStorageState("accent", { defaultValue: "Switch" })

	useEffect(() => {
		const mode = modesList.find(mode => mode.name == modeLocalStorage) || modesList[0]
		document.documentElement.style.setProperty('--background-primary-level', mode.primary)
		document.documentElement.style.setProperty('--background-secondary-level', mode.secondary)
		document.documentElement.style.setProperty('--text-color', mode.text)
		document.documentElement.style.setProperty('--text-color-70', mode.text + 'B3')
		document.documentElement.style.setProperty('--generic-game-image', mode.genericGame)

		const accent = accentsList.find(accent => accent.name == accentLocalStorage) || accentsList[0]
		document.documentElement.style.setProperty('--accent-primary-color', accent.primary)
		document.documentElement.style.setProperty('--accent-secondary-color', accent.secondary)
	})

	return null
}

export function generateUrl(primary: string, secondary: string) {
	return `data:image/svg+xml,<svg width='111' height='133' viewBox='0 0 111 133' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M28.5733 67.7766C28.5733 46.1706 44.9496 27.8774 61.8511 27.8774C66.4848 27.8774 70.6393 29.4025 74.1438 32.0111L88.3993 6.38805C81.5904 2.32103 73.8105 0 65.5098 0C29.2692 0 0 32.0569 0 71.4353C0 92.1495 10.4134 110.022 25.7022 119.089L39.9576 93.4663C32.9529 88.2492 28.5733 78.6109 28.5733 67.7766Z' fill='${primary}'/><path d='M84.7657 13.0428L70.5103 38.6658C77.5484 43.8996 81.9113 53.5671 81.9113 64.5014C81.9113 86.1032 65.7099 104.226 48.4584 104.226C43.8955 104.226 39.7911 102.709 36.3199 100.125L22.0645 125.748C28.8942 129.799 36.6907 132.103 44.9747 132.103C81.5612 132.103 110.485 100.392 110.485 61.1927C110.485 40.316 100.109 22.2102 84.7657 13.047V13.0428Z' fill='${secondary}'/></svg>`
}

export function useIconUrl() {
    const [accentLocalStorage, ] = useLocalStorageState("accent", {defaultValue: "Switch"})
    const accent = accentsList.find(accent => accent.name == accentLocalStorage) || accentsList[0]
    const primary = accent.primary.replaceAll('#', '%23')
    const secondary = accent.secondary.replaceAll('#', '%23')

    return generateUrl(primary, secondary);
}