import { requireUserAdmin } from "~/lib/session.server"
import TournamentEdit from "../edit/components/edit"
import { Route } from "./+types/new"
import { useLan } from "~/lib/components/contexts/LanContext"

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserAdmin(request)
}

export default function NewTournament() {
  const lan = useLan()
  return (
    <>
      <title>{`${lan.name} - Nouveau tournoi`}</title>
      <div className="is-full-height is-flex-row gap-3 p-3">
        <TournamentEdit />
      </div>
    </>
  )
}