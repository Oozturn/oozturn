import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import React from "react";
import { useGames } from "~/lib/components/contexts/GamesContext";
import { useLan } from "~/lib/components/contexts/LanContext";
import { useTournaments } from "~/lib/components/contexts/TournamentsContext";
import { useUser } from "~/lib/components/contexts/UserContext";
import { AddTournamentCrossSVG, SubsribedSVG } from "~/lib/components/data/svg-container";
import { FormattedTextWithUrls } from "~/lib/components/elements/formatted-text-url";
import { requireUserLoggedIn } from "~/lib/session.server";
import { Game } from "~/lib/types/games";
import { TournamentInfo, TournamentStatus } from "~/lib/tournamentEngine/types";

export const meta: MetaFunction = () => {
  return [
    { title: useLan().name + " - Accueil" }
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserLoggedIn(request)
  return null
}

export default function Index() {
  const me = useUser()
  const lan = useLan()
  const tournaments = useTournaments()
  const games = useGames()

  return (
    <>
      <div className='is-full-height is-flex is-flex-direction-column p-3'>
        {lan?.motd &&
          <div className='flat-box has-background-secondary-level px-5 pb-5 mb-3'>
            <div className='is-title big'>MOT DU JOUR</div>
            <p className='enable-line-break'>
              <FormattedTextWithUrls text={lan?.motd} />
            </p>
          </div>
        }
        <div className='is-title big has-background-secondary-level px-5 p-3'>TOURNOIS</div>
        <div className="flat-box has-background-secondary-level is-scrollable is-flex-grow-1 px-5 pt-0">
          <div className='homeTournamentsGrid'>
            {me?.isAdmin &&
              <Link to="/tournaments/new" className="flat-box homeTournamentBoxNew has-background-primary-accent is-flex is-justify-content-center is-align-items-center is-flex-direction-column is-clickable fade-on-mouse-out" data-id="editTournament">
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
      </div >
    </>
  );
}

function IndexTournamentTile({ tournament, userId, game }: { tournament: TournamentInfo, userId: string, game: Game | undefined }) {
  const backgroundImage = game?.id == undefined ? '' : 'url(/igdb/' + game?.picture + '.jpg)'
  return (

    <Link to={`/tournaments/${tournament.id}`} className={`flat-box homeTournamentBox is-clickable p-0 ${game?.id == undefined ? 'has-generic-game-background-image' : ''}`} style={{ backgroundImage: backgroundImage }}>
      <div className={`tournamentName ${tournament.status == TournamentStatus.Done && 'over'}`}>{tournament.name}</div>
      {tournament.players.find(player => player.userId == userId) &&
        <div className='subsribed is-flex is-align-items-center has-background-primary-accent'>
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