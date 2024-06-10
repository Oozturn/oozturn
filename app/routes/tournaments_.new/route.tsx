import { ActionFunctionArgs, MetaFunction, redirect } from "@remix-run/node";
import TournamentEdit from "~/lib/components/tournaments/edit";
import { newTournament } from "~/lib/persistence/tournaments.server";
import { requireUserLoggedIn } from "~/lib/session.server";
import { Tournament } from "~/lib/types/tournaments";
import { useLan } from "~/lib/components/contexts/LanContext";

export const meta: MetaFunction = () => {
    return [
        { title: useLan().name + " - Nouveau tournoi" }
    ]
}

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