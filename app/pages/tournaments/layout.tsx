import { Outlet } from "@remix-run/react"
import TournamentsList from "./components/tournaments-list"
import { LoaderFunctionArgs } from "@remix-run/node"
import { requireUserLoggedIn } from "~/lib/session.server"

export async function loader({ request }: LoaderFunctionArgs) {
    await requireUserLoggedIn(request)
    return null
}

export default function Tournaments() {

    return <div className="is-full-height is-flex-row gap-3 p-3">
        <TournamentsList />
        <Outlet />
    </div>
}