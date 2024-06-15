import { ActionFunctionArgs, MetaFunction, redirect } from "@remix-run/node";
import TournamentEdit from "~/lib/components/tournaments/edit";
import { newTournament } from "~/lib/persistence/tournaments.server";
import { requireUserLoggedIn } from "~/lib/session.server";
import { useLan } from "~/lib/components/contexts/LanContext";
import { BracketSettings, TournamentProperties } from "~/lib/tournamentEngine/types";

export const meta: MetaFunction = () => {
    return [
        { title: useLan().name + " - Nouveau tournoi" }
    ]
}

export async function action({ request }: ActionFunctionArgs) {
    requireUserLoggedIn(request)
    const jsonData = await request.json()
    const tournamentId = jsonData.tournamentId as string
    const tournamentSettings = JSON.parse(jsonData.tournamentSettings) as BracketSettings[]
    const tournamentProperties = JSON.parse(jsonData.tournamentProperties) as TournamentProperties
    newTournament(tournamentId, tournamentProperties, tournamentSettings)
    return redirect("/tournaments/" + tournamentId);
}

export default function NewTournament() {
    return <div className="is-full-height is-flex-row gap-3 p-3">
        <TournamentEdit />
    </div>
}