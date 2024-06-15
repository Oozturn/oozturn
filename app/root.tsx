import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData
} from "@remix-run/react";
import { GamesContext } from "./lib/components/contexts/GamesContext";
import { LanContext } from "./lib/components/contexts/LanContext";
import { TournamentsContext } from "./lib/components/contexts/TournamentsContext";
import { UserContext } from "./lib/components/contexts/UserContext";
import { UsersContext } from "./lib/components/contexts/UsersContext";
import Navbar from "./lib/components/layout/navbar";
import { GetUserTheme } from "./lib/components/tools/user-theme";
import { getGames } from "./lib/persistence/games.server";
import { getLan } from "./lib/persistence/lan.server";
import { getTournaments } from "./lib/persistence/tournaments.server";
import { getUserById, getUsers } from "./lib/persistence/users.server";
import { getUserId, isUserLoggedIn } from "./lib/session.server";
import { Game } from "./lib/types/games";
import { Lan } from "./lib/types/lan";
import { TournamentInfo } from "./lib/tournamentEngine/types";
import { User } from "./lib/types/user";
import "./styles/globals.scss";
import 'react-contexify/ReactContexify.css';

export async function loader({ request }: LoaderFunctionArgs): Promise<{
  lan: Lan;
  user?: User;
  users: User[];
  tournaments: TournamentInfo[];
  games?: Game[];
}> {
  if (await isUserLoggedIn(request)) {
    return {
      lan: getLan(),
      user: getUserById(String(await getUserId(request))),
      users: getUsers(),
      tournaments: getTournaments(),
      games: getGames()
    }
  } else {
    return {
      lan: getLan(),
      tournaments: [],
      users: []
    }
  }
}

export default function App() {
  const { lan, user, users, tournaments, games } = useLoaderData<typeof loader>()

  return (
    <html lang="fr">
      <LanContext.Provider value={lan}>
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
                <TournamentsContext.Provider value={tournaments}>
                  <GetUserTheme />
                  <Navbar />
                  <main className="main is-clipped">
                    <Outlet />
                  </main>
                </TournamentsContext.Provider>
              </UserContext.Provider>
            </UsersContext.Provider>
          </GamesContext.Provider>
          <ScrollRestoration />
          <Scripts />
        </body>
      </LanContext.Provider>
    </html>
  );
}
