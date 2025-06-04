import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import TournamentEdit from "./components/edit"
import { getLan } from "~/lib/persistence/lan.server"
import { getTournament, updateTournamentProperties, updateTournamentSettings, updateTournamentBracketSettings } from "~/lib/persistence/tournaments.server"
import { getUserId, requireUserAdmin } from "~/lib/session.server"
import { BracketSettings, TournamentFullData, TournamentProperties, TournamentSettings, TournamentStatus } from "~/lib/tournamentEngine/types"
import { EventServerError } from "~/lib/emitter.server"
import { validateIgdbCredentials } from "~/pages/admin/igdb-games.queries.server"


export const meta: MetaFunction<typeof loader> = ({ data }) => {
    return [
        { title: data?.lanName + " - Edition du tournoi " + data?.tournament.properties.name }
    ]
}

export async function loader({ params, request }: LoaderFunctionArgs): Promise<{
    tournament: TournamentFullData
    lanName: string
    igdbTokens: boolean
}> {
    requireUserAdmin(request)
    let tournament: TournamentFullData | undefined = undefined
    let igdbTokens = await validateIgdbCredentials()
    try {
        tournament = getTournament(params.id || "").getFullData()
    } catch { throw redirect('/tournaments/404') }
    return { tournament: tournament, lanName: getLan().name, igdbTokens: igdbTokens }
}

export async function action({ request }: ActionFunctionArgs) {
    requireUserAdmin(request)
    const jsonData = await request.json()
    const tournamentId = jsonData.tournamentId as string
    const partialTournamentSettings = JSON.parse(jsonData.tournamentSettings) as Partial<TournamentSettings>
    const tournamentBracketSettings = JSON.parse(jsonData.tournamentBracketSettings) as BracketSettings[]
    const partialTournamentProperties = JSON.parse(jsonData.tournamentProperties) as Partial<TournamentProperties>
    try {
        if ([TournamentStatus.Open, TournamentStatus.Balancing].includes(getTournament(tournamentId).getStatus())) {
            updateTournamentBracketSettings(tournamentId, tournamentBracketSettings)
            updateTournamentSettings(tournamentId, partialTournamentSettings)
        }
        updateTournamentProperties(tournamentId, partialTournamentProperties)
        return redirect("/tournaments/" + tournamentId)
    } catch (error) {
        const userId = await getUserId(request) as string
        EventServerError(userId, "Erreur lors de la mise à jour du tournoi : " + error as string)
    }
}


export default function TournamentEditPage() {
    const { tournament } = useLoaderData<typeof loader>()
    return <div className="is-full-height is-flex-row gap-3 p-3">
        <TournamentEdit existingTournament={tournament} />
    </div>
}