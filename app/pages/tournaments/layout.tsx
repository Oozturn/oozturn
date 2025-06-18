import { Outlet } from "react-router"
import TournamentsList from "./components/tournaments-list"
import { requireUserLoggedIn } from "~/lib/session.server"
import { Route } from "./+types/tournaments"

export async function loader({ request }: Route.LoaderArgs) {
    await requireUserLoggedIn(request)
    return null
}

export default function Tournaments() {

    return <div className="is-full-height is-flex-row gap-3 p-3">
        <TournamentsList />
        <Outlet />
    </div>
}