import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Link } from "@remix-run/react"
import React from "react"
import { useGames } from "~/lib/components/contexts/GamesContext"
import { useLan } from "~/lib/components/contexts/LanContext"
import { useTournaments } from "~/lib/components/contexts/TournamentsContext"
import { useUser } from "~/lib/components/contexts/UserContext"
import { AddTournamentCrossSVG, SubsribedSVG } from "~/lib/components/data/svg-container"
import { FormattedTextWithUrls } from "~/lib/components/elements/formatted-text-url"
import { requireUserLoggedIn } from "~/lib/session.server"
import { Game } from "~/lib/types/games"
import { TournamentInfo, TournamentStatus } from "~/lib/tournamentEngine/types"
import { getLan } from "~/lib/persistence/lan.server"
import { useRevalidateOnGlobalTournamentUpdate } from "../api/sse.hook"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.lanName + " - Accueil" }
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

export default function Index() {
  const me = useUser()
  const lan = useLan()
  const tournaments = useTournaments()
  const games = useGames()
  useRevalidateOnGlobalTournamentUpdate()

  return (
    <>
      <div className='is-full-height is-flex-col p-3 gap-3'>
        {lan?.motd &&
          <div className='is-flex-col gap-3 has-background-secondary-level p-5'>
            <div className='is-title big pb-3'>MOT DU JOUR</div>
            <p className='enable-line-break'>
              <FormattedTextWithUrls text={lan?.motd} />
            </p>
          </div>
        }
        <div className="grow has-background-secondary-level pr-2 py-5 pl-5 is-flex-col gap-5 is-clipped">
          <div className='is-title big'>TOURNOIS</div>
          <div className="is-scrollable grow">
            <div className='homeTournamentsGrid pr-4'>
              {me?.isAdmin &&
                <Link to="/tournaments/new" className="homeTournamentBox has-background-primary-accent is-flex-col justify-center align-center is-clickable fade-on-mouse-out" data-id="editTournament">
                  <AddTournamentCrossSVG />
                  <div className='has-text-weight-semibold'>Créer un tournoi</div>
                </Link>
              }
              {tournaments.map(tournament =>
                <React.Fragment key={tournament.id}>
                  <IndexTournamentTile tournament={tournament} userId={me.id} game={games?.find(game => game.id == tournament.game)} />
                </React.Fragment>
              )}
            </div>
          </div>
        </div>
      </div >
    </>
  )
}

function IndexTournamentTile({ tournament, userId, game }: { tournament: TournamentInfo, userId: string, game: Game | undefined }) {
  const backgroundImage = [game?.id, game?.picture].includes(undefined) ? 'var(--generic-game-image) !important' : 'url(/igdb/' + game?.picture + '.jpg)'
  return (

    <Link to={`/tournaments/${tournament.id}`} className="homeTournamentBox is-clickable p-0" style={{ backgroundImage: backgroundImage }}>
      <div className={`tournamentName ${tournament.status == TournamentStatus.Done && 'over'}`}>{tournament.name}</div>
      {tournament.players.find(player => player.userId == userId) &&
        <div className='subscribed is-flex align-center has-background-primary-accent'>
          <SubsribedSVG />
          <div className='ml-2'>Inscrit</div>
        </div>
      }
      {tournament.status == TournamentStatus.Balancing &&
        <div className='status-bar'>En préparation</div>
      }
      {tournament.status == TournamentStatus.Paused &&
        <div className='status-bar'>En pause</div>
      }
      {tournament.status == TournamentStatus.Running &&
        <div className='status-bar'>En cours</div>
      }
      {tournament.status == TournamentStatus.Validating &&
        <div className='status-bar'>En validation</div>
      }
      {tournament.status == TournamentStatus.Done &&
        <div className='over-overlay'>Terminé</div>
      }
    </Link>
  )
}