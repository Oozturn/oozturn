import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { getLan } from "~/lib/persistence/lan.server"
import { requireUserAdmin } from "~/lib/session.server"
import TournamentEdit from "../edit/components/edit"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: data?.lanName + " - Nouveau tournoi" }]
}

export async function loader({ request }: LoaderFunctionArgs): Promise<{
  lanName: string
}> {
  await requireUserAdmin(request)
  return { lanName: getLan().name }
}

export default function NewTournament() {
  return (
    <div className="is-full-height is-flex-row gap-3 p-3">
      <TournamentEdit />
    </div>
  )
}
