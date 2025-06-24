import { redirect, useLoaderData } from "react-router"
import TournamentEdit from "./components/edit"
import { getTournament } from "~/lib/persistence/tournaments.server"
import { requireUserAdmin } from "~/lib/session.server"
import { TournamentFullData } from "~/lib/tournamentEngine/types"
import { Route } from "./+types/edit"
import { useLan } from "~/lib/components/contexts/LanContext"

export async function loader({ params, request }: Route.LoaderArgs) {
    requireUserAdmin(request)
    let tournament: TournamentFullData | undefined = undefined
    try {
        tournament = getTournament(params.id || "").getFullData()
    } catch { throw redirect('/tournaments/404') }
    return { tournament: tournament }
}

export default function TournamentEditPage() {
    const { tournament } = useLoaderData<typeof loader>()
    const lan = useLan()
    return (
        <>
            <title>{`${lan.name} - Edition du tournoi ${tournament.properties.name}`}</title>
            <div className="is-full-height is-flex-row gap-3 p-3">
                <TournamentEdit existingTournament={tournament} />
            </div>
        </>
    )
}