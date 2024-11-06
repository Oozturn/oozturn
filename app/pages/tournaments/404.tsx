import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { getLan } from "~/lib/persistence/lan.server"
import { requireUserLoggedIn } from "~/lib/session.server"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.lanName + " - Tournoi inconnu" }
  ]
}

export async function loader({
  request
}: LoaderFunctionArgs): Promise<{
  lanName: string
}> {
  await requireUserLoggedIn(request)
  return { lanName: getLan().name }
}

export default function TournamentNotFound() {
  return <div className='grow is-flex-row has-background-secondary-level justify-center align-center'>
    404 — Tournament not found
  </div>
}