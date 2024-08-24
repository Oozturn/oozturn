import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node"
import { getLan } from "~/lib/persistence/lan.server"
import { newTournament } from "~/lib/persistence/tournaments.server"
import { requireUserAdmin } from "~/lib/session.server"
import { BracketSettings, TournamentProperties } from "~/lib/tournamentEngine/types"
import TournamentEdit from "../edit/components/edit"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.lanName + " - Nouveau tournoi" }
  ]
}

export async function loader({ request }: LoaderFunctionArgs): Promise<{
  lanName: string
}> {
  await requireUserAdmin(request)
  return { lanName: getLan().name }
}

export async function action({ request }: ActionFunctionArgs) {
  requireUserAdmin(request)
  const jsonData = await request.json()
  const tournamentId = jsonData.tournamentId as string
  const tournamentSettings = JSON.parse(jsonData.tournamentSettings) as BracketSettings[]
  const tournamentProperties = JSON.parse(jsonData.tournamentProperties) as TournamentProperties
  newTournament(tournamentId, tournamentProperties, tournamentSettings)
  return redirect("/tournaments/" + tournamentId)
}

export default function NewTournament() {
  return <div className="is-full-height is-flex-row gap-3 p-3">
    <TournamentEdit />
  </div>
}