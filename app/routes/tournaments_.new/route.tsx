import { ActionFunctionArgs, redirect } from "@remix-run/node";
import TournamentEdit from "~/lib/components/tournaments/edit";
import { newTournament, updateTournament } from "~/lib/persistence/tournaments.server";
import { requireUserLoggedIn } from "~/lib/session.server";
import { Tournament } from "~/lib/types/tournaments";


export async function action({ request }: ActionFunctionArgs) {
    requireUserLoggedIn(request)
    const jsonData = await request.json()
    const tournament = JSON.parse(jsonData.tournament) as Tournament
    newTournament(tournament)

    return redirect("/tournaments/" + tournament.id);
}

export default function NewTournament() {
    return <div className="is-full-height is-flex-row gap-3 p-3">
        <TournamentEdit />
    </div>
}