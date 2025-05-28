
interface SecuritySettings {
	newUsersByAdmin: boolean
	authentication: boolean
	securePassword: boolean
	useHttpOnly: boolean
	allOpponentsScore: boolean | "duel_only"
}

interface NotificationsSettings {
	tournamentStartStop: boolean
}

// Maybe this could be a user setting ?
interface AutoRefreshSettings {
	tournaments: boolean
	users: boolean
}

export interface Settings {
	security: SecuritySettings,
	notifications: NotificationsSettings,
	autoRefresh: AutoRefreshSettings
}

export interface CredentialsSettings {
	igdbClientId: string
	igdbClientSecret: string
	adminPasswordHash: string
}