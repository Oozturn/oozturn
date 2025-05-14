import type { LoaderFunctionArgs } from "@remix-run/node"
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData
} from "@remix-run/react"
import { GamesContext } from "./lib/components/contexts/GamesContext"
import { LanContext } from "./lib/components/contexts/LanContext"
import { TournamentsContext } from "./lib/components/contexts/TournamentsContext"
import { UserContext } from "./lib/components/contexts/UserContext"
import { UsersContext } from "./lib/components/contexts/UsersContext"
import { StatsContext } from "./lib/components/contexts/StatsContext"
import Navbar from "./lib/components/layout/navbar"
import { GetUserTheme, useIconUrl } from "./lib/components/tools/user-theme"
import { getGames } from "./lib/persistence/games.server"
import { getLan } from "./lib/persistence/lan.server"
import { getTournaments } from "./lib/persistence/tournaments.server"
import { getUsers } from "./lib/persistence/users.server"
import { getStats } from "./lib/runtimeGlobals/statistics.server"
import { getUserFromRequest, isUserLoggedIn } from "./lib/session.server"
import { Game } from "./lib/types/games"
import { Lan } from "./lib/types/lan"
import { PlayableMatch, TournamentInfo } from "./lib/tournamentEngine/types"
import { User } from "./lib/types/user"
import { Statistics } from "./lib/types/statistics"
import "./styles/globals.scss"
import 'react-contexify/ReactContexify.css'
import { Notification } from "./lib/components/notification"
import { useRevalidateOnLanUpdate } from "./api/sse.hook"
import Footer from "./lib/components/layout/footer"
import { PlayableMatchesContext } from "./lib/components/contexts/PlayableMatchesContext"
import { getPlayableMatches } from "./lib/runtimeGlobals/playableMatches.server"

export async function loader({ request }: LoaderFunctionArgs): Promise<{
  lan: Lan
  user?: User
  users: User[]
  tournaments: TournamentInfo[]
  games?: Game[]
  stats?: Statistics
  playableMatches: PlayableMatch[]
}> {
  if (await isUserLoggedIn(request)) {
    const user = await getUserFromRequest(request) as User
    return {
      lan: getLan(),
      user: user,
      users: getUsers(),
      tournaments: getTournaments(),
      games: getGames(),
      stats: getStats(),
      playableMatches: getPlayableMatches(user.id)
    }
  } else {
    return {
      lan: getLan(),
      tournaments: [],
      users: [],
      playableMatches: []
    }
  }
}

export default function App() {
  const { lan, user, users, tournaments, games, stats, playableMatches } = useLoaderData<typeof loader>()
  const iconUrl = useIconUrl()
  useRevalidateOnLanUpdate()
  return (
    <html lang="fr">
      <LanContext.Provider value={lan}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href={iconUrl} />
          <Meta />
          <Links />
        </head>
        <body>
          <GamesContext.Provider value={games}>
            <UsersContext.Provider value={users}>
              <UserContext.Provider value={user}>
                <TournamentsContext.Provider value={tournaments}>
                  <PlayableMatchesContext.Provider value={playableMatches}>
                    <StatsContext.Provider value={stats}>
                      <GetUserTheme />
                      <Navbar />
                      <main className="main is-clipped">
                        <Outlet />
                      </main>
                      <Footer />
                      <Notification />
                    </StatsContext.Provider>
                  </PlayableMatchesContext.Provider>
                </TournamentsContext.Provider>
              </UserContext.Provider>
            </UsersContext.Provider>
          </GamesContext.Provider>
          <ScrollRestoration />
          <Scripts />
        </body>
      </LanContext.Provider>
    </html>
  )
}
