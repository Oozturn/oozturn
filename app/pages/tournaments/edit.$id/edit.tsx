import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import TournamentEdit from "./components/edit"
import { getLan } from "~/lib/persistence/lan.server"
import { getTournament, updateTournamentProperties, updateTournamentSettings } from "~/lib/persistence/tournaments.server"
import { requireUserLoggedIn } from "~/lib/session.server"
import { BracketSettings, TournamentFullData, TournamentProperties } from "~/lib/tournamentEngine/types"


export const meta: MetaFunction<typeof loader> = ({ data }) => {
    return [
        { title: data?.lanName + " - Edition du tournoi " + data?.tournament.properties.name }
    ]
}

export async function loader({ params, request }: LoaderFunctionArgs): Promise<{
    tournament: TournamentFullData
    lanName: string
}> {
    requireUserLoggedIn(request)
    let tournament: TournamentFullData | undefined = undefined
    try {
        tournament = getTournament(params.id || "").getFullData()
    } catch { throw redirect('/tournaments/404') }
    return { tournament: tournament, lanName: getLan().name }
}

export async function action({ request }: ActionFunctionArgs) {
    requireUserLoggedIn(request)
    const jsonData = await request.json()
    const tournamentId = jsonData.tournamentId as string
    const partialTournamentSettings = JSON.parse(jsonData.tournamentSettings) as Partial<BracketSettings>
    const partialTournamentProperties = JSON.parse(jsonData.tournamentProperties) as Partial<TournamentProperties>
    updateTournamentSettings(tournamentId, partialTournamentSettings)
    updateTournamentProperties(tournamentId, partialTournamentProperties)
    return redirect("/tournaments/" + tournamentId)
}


export default function TournamentEditPage() {
    const { tournament } = useLoaderData<typeof loader>()
    return <div className="is-full-height is-flex-row gap-3 p-3">
        <TournamentEdit existingTournament={tournament} />
    </div>
}