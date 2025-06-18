import { MetaFunction, redirect } from "react-router"
import { useLoaderData } from "react-router"
import TournamentEdit from "./components/edit"
import { getLan } from "~/lib/persistence/lan.server"
import { getTournament, updateTournamentProperties, updateTournamentSettings, updateTournamentBracketSettings } from "~/lib/persistence/tournaments.server"
import { getUserId, requireUserAdmin } from "~/lib/session.server"
import { BracketSettings, TournamentFullData, TournamentProperties, TournamentSettings, TournamentStatus } from "~/lib/tournamentEngine/types"
import { EventServerError } from "~/lib/emitter.server"
import { Route } from "./+types/edit"


export const meta: MetaFunction<typeof loader> = ({ data }) => {
    return [
        { title: data?.lanName + " - Edition du tournoi " + data?.tournament.properties.name }
    ]
}

export async function loader({ params, request }: Route.LoaderArgs): Promise<{
    tournament: TournamentFullData
    lanName: string
}> {
    requireUserAdmin(request)
    let tournament: TournamentFullData | undefined = undefined
    try {
        tournament = getTournament(params.id || "").getFullData()
    } catch { throw redirect('/tournaments/404') }
    return { tournament: tournament, lanName: getLan().name }
}

export async function action({ request }: Route.ActionArgs) {
    requireUserAdmin(request)
    const formData = await request.formData()
    const tournamentId = String(formData.get("tournamentId"))
    const tournamentImageFile = formData.get("tournamentImageFile") as File | null
    const partialTournamentSettings = JSON.parse(String(formData.get("tournamentSettings"))) as Partial<TournamentSettings>
    const tournamentBracketSettings = JSON.parse(String(formData.get("tournamentBracketSettings"))) as BracketSettings[]
    const partialTournamentProperties = JSON.parse(String(formData.get("tournamentProperties"))) as Partial<TournamentProperties>
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