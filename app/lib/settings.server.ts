import lanConfig from "config.json"
import { CredentialsSettings, Settings } from "./types/settings"

// eslint-disable-next-line no-var
var publicSettings: Settings
// eslint-disable-next-line no-var
var credentials: CredentialsSettings

function getEnvOrJson<T extends boolean | string>(envVar: string | undefined, jsonVar: T): T {
	if (typeof jsonVar == "boolean") {
		return envVar === 'true' ? true as T : envVar === 'false' ? false as T : jsonVar
	}
	return envVar != undefined ? envVar as T : jsonVar
}

export function getSettingsFromEnv() {
	// security
	publicSettings.security = {
		newUsersByAdmin: getEnvOrJson(process.env.NEW_USERS_BY_ADMIN, lanConfig.security.newUsersByAdmin),
		authentication: getEnvOrJson(process.env.AUTHENTICATION_NEEDED, lanConfig.security.authentication),
		securePassword: getEnvOrJson(process.env.SECURE_PASSWORDS, lanConfig.security.securePassword),
		useHttpOnly: getEnvOrJson(process.env.USE_HTTP_ONLY, lanConfig.security.useHttpOnly)
	}
	credentials = {
		igdbClientId: getEnvOrJson(process.env.IGDB_CLIENT_ID, lanConfig.credentials.igdbClientId),
		igdbClientSecret: getEnvOrJson(process.env.IGDB_CLIENT_SECRET, lanConfig.credentials.igdbClientSecret),
		adminPasswordHash: getEnvOrJson(process.env.ADMIN_PASSWORD_HASH, lanConfig.credentials.adminPasswordHash)
	}
	publicSettings.notifications = {
		tournamentStartStop: getEnvOrJson(process.env.NOTIFY_TOURNAMENT_START_STOP, lanConfig.notifications.tournamentStartStop)
	}
	publicSettings.autoRefresh = {
		tournaments: getEnvOrJson(process.env.AUTO_REFRESH_TOURNAMENTS, lanConfig.autorefresh.tournaments),
		users: getEnvOrJson(process.env.AUTO_REFRESH_USERS, lanConfig.autorefresh.users)
	}

	// Write back settings in config.json ?
	//writeSafe("config.json", JSON.stringify({security, credentials, notifications, autoRefresh}, null, 2))
}

export function getSettings(): Readonly<Settings> {
	return publicSettings
}
export function getIgdbCredentials(): Readonly<{ id: string, secret: string }> {
	return { id: credentials.igdbClientId, secret: credentials.igdbClientSecret }
}
export function getAdminPasswordHash(): Readonly<string> {
	return credentials.adminPasswordHash
}