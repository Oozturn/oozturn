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

interface QoLanSettings {
  placedPlayers: boolean
}

export interface Settings {
  security: SecuritySettings
  notifications: NotificationsSettings
  qoLan: QoLanSettings
}

export interface CredentialsSettings {
  adminPasswordHash: string
}
