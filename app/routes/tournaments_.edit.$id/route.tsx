import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useLan } from "~/lib/components/contexts/LanContext";
import TournamentEdit from "~/lib/components/tournaments/edit";
import { getTournament, updateTournament } from "~/lib/persistence/tournaments.server";
import { requireUserLoggedIn } from "~/lib/session.server";
import { Tournament } from "~/lib/types/tournaments";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    return [
        { title: useLan().name + " - Edition du tournoi " + data?.tournament.name }
    ]
}

export async function loader({ params, request }: LoaderFunctionArgs): Promise<{ tournament: Tournament }> {
    requireUserLoggedIn(request)
    let tournament: Tournament | undefined = undefined
    try {
        tournament = getTournament(params.id || "")
    } catch { throw redirect('/tournaments/404') }
    return { tournament: tournament };
}

export async function action({ request }: ActionFunctionArgs) {
    requireUserLoggedIn(request)
    const jsonData = await request.json()
    const tournamentId = jsonData.tournamentId as string
    const partialTournament = JSON.parse(jsonData.tournament) as Partial<Tournament>
    updateTournament(tournamentId, partialTournament)
    return redirect("/tournaments/" + tournamentId);
}


export default function TournamentEditPage() {
    const { tournament } = useLoaderData<typeof loader>();
    return <div className="is-full-height is-flex-row gap-3 p-3">
        <TournamentEdit existingTournament={tournament} />
    </div>
}