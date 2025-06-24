import { requireUserLoggedIn } from "~/lib/session.server"
import { Route } from "./+types/tournaments"
import { useLan } from "~/lib/components/contexts/LanContext"

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserLoggedIn(request)
}

export default function TournamentSelection() {
  const lan = useLan()
  return (
    <>
      <title>{`${lan.name} - Tournois`}</title>
      <div className='grow is-flex-row has-background-secondary-level justify-center align-center'>
        Sélectionner un tournoi dans la liste
      </div>
    </>
  )
}