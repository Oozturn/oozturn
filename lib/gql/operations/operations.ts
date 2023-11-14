export const LOGGEDINUSER_FRAGMENT = /* GraphQL */ `
fragment LoggedInUser on LoggedInUser {
  username
  isAdmin
  avatar
  team
  ip
}
`

export const LAN_FRAGMENT = /* GraphQL */ `
fragment Lan on Lan {
  motd
  name
  defaultTournamentSettings {
    leaders
    default
  }
  weightTeamsResults
  partialResults
  startDate {
    day
    hour
    min
  }
  endDate {
    day
    hour
    min
  }
}
`

export const LOGIN_MUTATION = /* GraphQL */ `
${LOGGEDINUSER_FRAGMENT}
mutation Login($username: String = "") {
  login(username: $username) {
    ...LoggedInUser
  }
}
`

export const ADMIN_ELEVATION_MUTATION = /* GraphQL */ `
${LOGGEDINUSER_FRAGMENT}
mutation adminElevation($password: String = "") {
  adminElevation(password: $password) {
    ...LoggedInUser
  }
}
`

export const EDIT_TOURNAMENT_MUTATION = /* GraphQL */ `
mutation editTournament(
  $id: String = "",
  $name: String,
  $game: Int,
  $bracketProperties: BracketPropertiesInput,
  $status: TournamentStatus,
  $useTeams: Boolean,
  $usersCanCreateTeams: Boolean,
  $teamsMaxSize: Int,
  $startTime: DateInput,
  $globalTournamentSettings: GlobalTournamentSettingsInput,
  $comments: String) {
    editTournament(input: {
      id: $id,
      name: $name,
      game: $game,
      status: $status,
      bracketProperties: $bracketProperties,
      useTeams: $useTeams,
      usersCanCreateTeams: $usersCanCreateTeams,
      teamsMaxSize: $teamsMaxSize,
      startTime: $startTime,
      globalTournamentSettings: $globalTournamentSettings,
      comments: $comments
    })
}
`

export const MOVE_PLAYER_MUTATION = /* GraphQL */ `
mutation movePlayer(
  $tournamentId: String!,
  $player: String!,
  $newIndex: Int!) {
    movePlayer(tournamentId: $tournamentId, player:$player, newIndex: $newIndex)
}
`

export const MOVE_TEAM_MUTATION = /* GraphQL */ `
mutation moveTeam(
  $tournamentId: String!,
  $team: String!,
  $newIndex: Int!) {
    moveTeam(tournamentId: $tournamentId, team:$team, newIndex: $newIndex)
}
`

export const NEW_TOURNAMENT_TEAM_MUTATION = /* GraphQL */ `
mutation newTournamentTeam(
  $tournamentId: String!,
  $teamName: String!) {
    newTournamentTeam(
      tournamentId: $tournamentId,
      teamName: $teamName
    )
}
`

export const RENAME_TOURNAMENT_TEAM_MUTATION = /* GraphQL */ `
mutation renameTournamentTeam(
  $tournamentId: String!,
  $oldTeamName: String!,
  $newTeamName: String!) {
    renameTournamentTeam(
      tournamentId: $tournamentId,
      oldTeamName: $oldTeamName,
      newTeamName: $newTeamName
    )
}
`

export const REMOVE_TOURNAMENT_TEAM_MUTATION = /* GraphQL */ `
mutation removeTournamentTeam(
  $tournamentId: String!,
  $teamName: String!) {
    removeTournamentTeam(
      tournamentId: $tournamentId,
      teamName: $teamName
    )
}
`

export const ADD_PLAYERS_TO_TEAM_MUTATION = /* GraphQL */ `
mutation addPlayersToTeam(
  $tournamentId: String!,
  $teamName: String!,
  $players: [String!]!) {
    addPlayersToTeam(
      tournamentId: $tournamentId,
      teamName: $teamName,
      players: $players
    )
}
`

export const REMOVE_PLAYERS_FROM_TEAM_MUTATION = /* GraphQL */ `
mutation removePlayersFromTeam(
  $tournamentId: String!,
  $players: [String!]!) {
    removePlayersFromTeam(
      tournamentId: $tournamentId,
      players: $players
    )
}
`

export const ADD_PLAYER_TO_TOURNAMENT_MUTATION = /* GraphQL */ `
mutation addPlayerToTournament(
  $tournamentId: String = "",
  $player: String = "") {
    addPlayerToTournament(
      tournamentId: $tournamentId,
      player: $player
    )
}
`

export const REMOVE_PLAYER_FROM_TOURNAMENT_MUTATION = /* GraphQL */ `
mutation removePlayerFromTournament(
  $tournamentId: String = "",
  $player: String = "") {
    removePlayerFromTournament(
      tournamentId: $tournamentId,
      player: $player
    )
}
`

export const FORFEIT_OPPONENT_FROM_TOURNAMENT_MUTATION = /* GraphQL */ `
mutation forfeitOpponentFromTournament(
  $tournamentId: String = "",
  $opponent: String = "") {
    forfeitOpponentFromTournament(
      tournamentId: $tournamentId,
      opponent: $opponent
    )
}
`

export const START_TOURNAMENT_MUTATION = /* GraphQL */ `
mutation startTournament($id: String = "") {
  startTournament(id: $id)
}
`

export const BALANCE_TOURNAMENT_MUTATION = /* GraphQL */ `
mutation balanceTournament($id: String = "") {
  balanceTournament(id: $id)
}
`

export const STOP_TOURNAMENT_MUTATION = /* GraphQL */ `
mutation stopTournament($id: String = "") {
  stopTournament(id: $id)
}
`

export const VALIDATE_TOURNAMENT_MUTATION = /* GraphQL */ `
mutation validateTournament($id: String = "") {
  validateTournament(id: $id)
}
`

export const REMOVE_TOURNAMENT_MUTATION = /* GraphQL */ `
mutation removeTournament($id: String = "") {
  removeTournament(id: $id)
}
`

export const SET_SCORE_MUTATION = /* GraphQL */ `
mutation setScore(
  $tournamentId: String!,
  $matchId: IdInput!,
  $player: Int!
  $score: Int!) {
    setScore(tournamentId: $tournamentId, matchId: $matchId, player:$player,score: $score)
}
`

export const UPDATE_LAN_MUTATION = /* GraphQL */ `
${LAN_FRAGMENT}
mutation updateLan($motd: String, $name: String, $defaultTournamentSettings: GlobalTournamentSettingsInput, $weightTeamsResults: Boolean, $partialResults: Boolean, $startDate: DateInput, $endDate: DateInput) {
  updateLan(lan: {name: $name, motd: $motd, defaultTournamentSettings: $defaultTournamentSettings, weightTeamsResults: $weightTeamsResults, partialResults: $partialResults, startDate: $startDate, endDate: $endDate}) {
    ...Lan
  }
}
`

export const UPDATE_PROFILE_MUTATION = /* GraphQL */ `
${LOGGEDINUSER_FRAGMENT}
mutation updateProfile($avatarFile: File, $team: String, $removeAvatar: Boolean) {
  updateProfile(avatarFile: $avatarFile, team: $team, removeAvatar: $removeAvatar) {
    ...LoggedInUser
  }
}
`

export const SET_GAME_MUTATION = /* GraphQL */ `
mutation setGame($id: Int!, $name: String!, $platforms: [Int!]!, $cover: String!, $picture: String!, $release: Int) {
    setGame(id: $id, name: $name, platforms: $platforms, cover: $cover, picture: $picture, release: $release)
}
`

export const REMOVE_GAME_MUTATION = /* GraphQL */ `
mutation removeGame($id: Int!) {
    removeGame(id: $id)
}
`

export const GET_ME_QUERY = /* GraphQL */ `
${LOGGEDINUSER_FRAGMENT}
query me {
  me {
    ...LoggedInUser
  }
}
`

export const GET_PLAYERS_QUERY = /* GraphQL */ `
query players {
  players {
    isAdmin
    username
    avatar
    team
    ips
  }
}
`

export const GET_TOURNAMENTS_QUERY = /* GraphQL */ `
query tournaments {
  tournaments {
    id
    name
    game
    status
    startTime {
      day
      hour
      min
    }
    players
  }
}
`

export const GET_TOURNAMENT_QUERY = /* GraphQL */ `
query tournament($id: String!)  {
  tournament(id: $id) {
    id
    name
    game
    bracketProperties {
      type
      options {
        last
        short
        lowerScoreIsBetter
        sizes
        advancers
        limit
      }
      seeding {
        nb
        opponent
      }
    }
    matches {
      id {
        s
        r
        m
      }
      p
      m
    }
    status
    players {
      username
      avatar
      team
      ips
    }
    forfeitOpponents
    useTeams
    usersCanCreateTeams
    teamsMaxSize
    teams {
      name
      players
    }
    startTime {
      day
      hour
      min
    }
    globalTournamentSettings {
        leaders
        default
    }
    comments
    results {
      username
      position
    }
  }
}
`

export const GET_LAN_QUERY = /* GraphQL */ `
${LAN_FRAGMENT}
query lan {
  lan {
    ...Lan
  }
}
`

export const GET_LEADERBOARD_QUERY = /* GraphQL */ `
query leaderboard {
  leaderboard {
    player {
      username
      avatar
      team
    }
    points
    wins
    losses
    LBwins
    secondPlaces
    tournaments
  }
}
`

export const GET_ACHIEVEMENTS_QUERY = /* GraphQL */ `
query achievements {
  achievements {
    name
    description
    player {
      username
      avatar
      team
    }
  }
}
`

export const GET_GAMES_QUERY = /* GraphQL */ `
query games {
  games {
    id
    name
    platforms
    cover
    picture
    release
  }
}
`

export const SEARCH_IGDB_GAMES = /* GraphQL */ `
query igdbGames($searchCriteria: String!, $idToSearch: Int) {
  igdbGames(searchCriteria: $searchCriteria, idToSearch: $idToSearch) {
    id
    name
    platforms
    cover
    pictures
    release
  }
}
`