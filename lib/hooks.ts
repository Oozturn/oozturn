import { AchievementsQuery, GamesQuery, LanQuery, LeaderboardQuery, MeQuery, PlayersQuery, TournamentQuery, TournamentQueryVariables, TournamentsQuery } from "../__generated__/gql/types";
import { GET_ACHIEVEMENTS_QUERY, GET_GAMES_QUERY, GET_LAN_QUERY, GET_LEADERBOARD_QUERY, GET_ME_QUERY, GET_PLAYERS_QUERY, GET_TOURNAMENTS_QUERY, GET_TOURNAMENT_QUERY } from "./gql/operations/operations";
import useSWR from "swr"
import { generateUrl } from "../components/tools/user-theme";
import useLocalStorageState from "use-local-storage-state";
import { accentsList } from "./data/themes";


export function useMe() {
    return useSWR<MeQuery>(GET_ME_QUERY)
}

export function useLan() {
    return useSWR<LanQuery>(GET_LAN_QUERY)
}

export function usePlayers() {
    return useSWR<PlayersQuery>(GET_PLAYERS_QUERY)
}

export function useTournaments() {
    return useSWR<TournamentsQuery>(GET_TOURNAMENTS_QUERY, {refreshInterval: 5000})
}

export function useTournament(id: string) {
    return useSWR<TournamentQuery, TournamentQueryVariables>([GET_TOURNAMENT_QUERY, {id:id}])
}

export function useLeaderboard() {
    return useSWR<LeaderboardQuery>(GET_LEADERBOARD_QUERY, {refreshInterval: 10000})
}
export function useAchievements() {
    return useSWR<AchievementsQuery>(GET_ACHIEVEMENTS_QUERY, {refreshInterval: 10000})
}
export function useGames() {
    return useSWR<GamesQuery>(GET_GAMES_QUERY)
}

export function useIconUrl() {
    const [accentLocalStorage, setAccentLocalStorage] = useLocalStorageState("accent", {defaultValue: "Switch"})
    const accent = accentsList.find(accent => accent.name == accentLocalStorage) || accentsList[0]
    const primary = accent.primary.replaceAll('#', '%23')
    const secondary = accent.secondary.replaceAll('#', '%23')

    return generateUrl(primary, secondary);
}