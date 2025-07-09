import type { LoaderFunctionArgs } from "@remix-run/node"
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData
} from "@remix-run/react"
import { LanContext } from "./lib/components/contexts/LanContext"
import { TournamentsContext } from "./lib/components/contexts/TournamentsContext"
import { UserContext } from "./lib/components/contexts/UserContext"
import { UsersContext } from "./lib/components/contexts/UsersContext"
import { StatsContext } from "./lib/components/contexts/StatsContext"
import Navbar from "./lib/components/layout/navbar"
import { GetUserTheme, useIconUrl } from "./lib/components/tools/user-theme"
import { getLan } from "./lib/persistence/lan.server"
import { getTournaments } from "./lib/persistence/tournaments.server"
import { getUsers } from "./lib/persistence/users.server"
import { getStats } from "./lib/runtimeGlobals/statistics.server"
import { getUserFromRequest, isUserLoggedIn } from "./lib/session.server"
import { Settings } from "./lib/types/settings"
import { Lan } from "./lib/types/lan"
import { PlayableMatch, TournamentInfo } from "./lib/tournamentEngine/types"
import { User } from "./lib/types/user"
import { Statistics } from "./lib/types/statistics"
import "./styles/globals.scss"
import 'react-contexify/ReactContexify.css'
import { NotificationNode } from "./lib/components/notification"
import { useRevalidateOnLanUpdate } from "./api/sse.hook"
import Footer from "./lib/components/layout/footer"
import { PlayableMatchesContext } from "./lib/components/contexts/PlayableMatchesContext"
import { getPlayableMatches } from "./lib/runtimeGlobals/playableMatches.server"
import { SettingsContext } from "./lib/components/contexts/SettingsContext"

export async function loader({ request }: LoaderFunctionArgs): Promise<{
  settings: Settings
  lan: Lan
  user?: User
  users: User[]
  tournaments: TournamentInfo[]
  stats?: Statistics
  playableMatches: PlayableMatch[]
}> {
  const settings: Settings = {
    autoRefresh: {
      tournaments: process.env.AUTO_REFRESH_TOURNAMENTS === "false" ? false : true,
      users: process.env.AUTO_REFRESH_USERS === "false" ? false : true
    },
    security: {
      newUsersByAdmin: process.env.NEW_USERS_BY_ADMIN === "false" ? false : true,
      authentication: process.env.AUTHENTICATION === "false" ? false : true,
      securePassword: process.env.SECURE_PASSWORD === "false" ? false : true,
      useHttpOnly: process.env.USE_HTTP_ONLY === "true" ? true : false,
      allOpponentsScore: process.env.ALL_OPPONENTS_SCORE === "duel_only" ? "duel_only" : (process.env.ALL_OPPONENTS_SCORE === "true" ? true : false)
    },
    notifications: {
      tournamentStartStop: process.env.NOTIFICATION_TOURNAMENT_CHANGE === "false" ? false : true,
    },
    qoLan: {
      placedPlayers: process.env.ASK_FOR_SEATS === "false" ? false : true,
    }
  }
  if (await isUserLoggedIn(request)) {
    const user = await getUserFromRequest(request) as User
    return {
      settings: settings,
      lan: getLan(),
      user: user,
      users: getUsers(),
      tournaments: getTournaments(),
      stats: getStats(),
      playableMatches: getPlayableMatches(user.id)
    }
  } else {
    return {
      settings: settings,
      lan: getLan(),
      tournaments: [],
      users: [],
      playableMatches: []
    }
  }
}

export default function App() {
  const { settings, lan, user, users, tournaments, stats, playableMatches } = useLoaderData<typeof loader>()
  const iconUrl = useIconUrl()
  useRevalidateOnLanUpdate()
  return (
    <html lang="fr">
      <SettingsContext.Provider value={settings}>
        <LanContext.Provider value={lan}>
          <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href={iconUrl} />
            <Meta />
            <Links />
          </head>
          <body>
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
                      <NotificationNode />
                    </StatsContext.Provider>
                  </PlayableMatchesContext.Provider>
                </TournamentsContext.Provider>
              </UserContext.Provider>
            </UsersContext.Provider>
            <ScrollRestoration />
            <Scripts />
          </body>
        </LanContext.Provider>
      </SettingsContext.Provider>
    </html>
  )
}
