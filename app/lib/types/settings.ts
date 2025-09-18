
interface SecuritySettings {
	newUsersByAdmin: boolean
	authentication: boolean
	securePassword: boolean
	useHttpOnly: boolean
	allOpponentsScore: boolean | "duel_only"
	allowEasyLogin: boolean
}

interface NotificationsSettings {
	tournamentStartStop: boolean
}

// Maybe this could be a user setting ?
interface AutoRefreshSettings {
	tournaments: boolean
	users: boolean
}

interface QoLanSettings {
	placedPlayers: boolean
}

export interface Settings {
	security: SecuritySettings,
	notifications: NotificationsSettings,
	autoRefresh: AutoRefreshSettings,
	qoLan: QoLanSettings
}

export interface CredentialsSettings {
	adminPasswordHash: string
}