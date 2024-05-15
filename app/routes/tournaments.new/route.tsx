import { ActionFunctionArgs, redirect } from "@remix-run/node";
import TournamentEdit from "~/lib/components/tournaments/edit";
import { updateTournament } from "~/lib/persistence/tournaments.server";
import { requireUserLoggedIn } from "~/lib/session.server";
import { Tournament } from "~/lib/types/tournaments";


export async function action({ request }: ActionFunctionArgs) {
    requireUserLoggedIn(request)

    const formData = await request.formData()
    const tournament = JSON.parse(String(formData.get("tournament"))) as Tournament
    updateTournament(tournament.id, tournament)

    return redirect("/tournaments/" + tournament.id);
}

export default function NewTournament() {
    return <TournamentEdit />
}