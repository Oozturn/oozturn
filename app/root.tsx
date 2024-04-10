import type { ActionFunctionArgs, LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import "./styles/globals.scss"
import Navbar from "./lib/components/layout/navbar";
import { LanContext } from "./lib/components/contexts/LanContext";
import { getLan } from "./lib/persistence/lan.server";
import { UserContext } from "./lib/components/contexts/UserContext";
import { getUsername, isUserAdmin } from "./lib/session.server";
import { getUser, getUsers, updateUser } from "./lib/persistence/users.server";
import { GetUserTheme } from "./lib/components/tools/user-theme";
import { UsersContext } from "./lib/components/contexts/UsersContext";
import { TournamentsContext } from "./lib/components/contexts/TournamentsContext";
import { getTournaments } from "./lib/persistence/tournaments.server";
import { getGames } from "./lib/persistence/games.server";
import { GamesContext } from "./lib/components/contexts/GamesContext";

export async function loader({ request }: LoaderFunctionArgs) {
  return {
    lan: getLan(),
    user: getUser(String(await getUsername(request))),
    users: getUsers(),
    tournaments: getTournaments(),
    games: getGames()
  }
}

export default function App() {
  const { lan, user, users, tournaments, games } = useLoaderData<typeof loader>()
  
    return (
      <html lang="fr">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body>
          <GamesContext.Provider value={games}>
            <UsersContext.Provider value={users}>
              <UserContext.Provider value={user}>
                <LanContext.Provider value={lan}>
                  <TournamentsContext.Provider value={tournaments}>
                    <GetUserTheme />
                    <Navbar />
                    <main className="main is-clipped">
                      <Outlet />
                    </main>
                  </TournamentsContext.Provider>
                </LanContext.Provider>
              </UserContext.Provider>
            </UsersContext.Provider>
          </GamesContext.Provider>
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    );
}
