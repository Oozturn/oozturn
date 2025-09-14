import { LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import TournamentEdit from "./components/edit"
import { getLan } from "~/lib/persistence/lan.server"
import { getTournament } from "~/lib/persistence/tournaments.server"
import { requireUserAdmin } from "~/lib/session.server"
import { TournamentFullData } from "~/lib/tournamentEngine/types"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: data?.lanName + " - Edition du tournoi " + data?.tournament.properties.name }]
}

export async function loader({ params, request }: LoaderFunctionArgs): Promise<{
  tournament: TournamentFullData
  lanName: string
}> {
  requireUserAdmin(request)
  let tournament: TournamentFullData | undefined = undefined
  try {
    tournament = getTournament(params.id || "").getFullData()
  } catch {
    throw redirect("/tournaments/404")
  }
  return { tournament: tournament, lanName: getLan().name }
}

export default function TournamentEditPage() {
  const { tournament } = useLoaderData<typeof loader>()
  return (
    <div className="is-full-height is-flex-row gap-3 p-3">
      <TournamentEdit existingTournament={tournament} />
    </div>
  )
}
