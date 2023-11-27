import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import appStylesHref from "./styles/globals.css"
import Navbar from "./lib/components/layout/navbar";
import { LanContext } from "./lib/components/contexts/LanContext";
import { getLan } from "./lib/persistence/lan.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];

export async function loader() {
  return getLan()
}

export default function App() {
  const lan = useLoaderData<typeof loader>()

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <LanContext.Provider value={lan}>
          <Outlet />
        </LanContext.Provider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
