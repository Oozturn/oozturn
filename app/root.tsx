import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
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
import { User, UserContext } from "./lib/components/contexts/UserContext";
import { getUsername, isUserAdmin } from "./lib/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return {
    lan: getLan(),
    user: {
      username: await getUsername(request),
      isAdmin: await isUserAdmin(request)
    }
  }
}

export default function App() {
  const { lan, user } = useLoaderData<typeof loader>()

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <UserContext.Provider value={user}>
          <LanContext.Provider value={lan}>
            <Outlet />
          </LanContext.Provider>
        </UserContext.Provider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
