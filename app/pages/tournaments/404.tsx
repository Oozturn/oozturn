import { requireUserLoggedIn } from "~/lib/session.server"
import { Route } from "./+types/404"
import { useLan } from "~/lib/components/contexts/LanContext"

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserLoggedIn(request)
}

export default function TournamentNotFound() {
  const lan = useLan()
  return (
    <>
      <title>{`${lan.name} - Tournoi inconnu`}</title>
      <div className='grow is-flex-row has-background-secondary-level justify-center align-center'>
        404 — Tournament not found
      </div>
    </>
  )
}