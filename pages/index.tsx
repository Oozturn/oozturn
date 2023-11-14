import Head from 'next/head'
import { useGames, useLan, useMe, useTournaments } from "../lib/hooks";
import Link from 'next/link'
import { Game, TournamentLight, TournamentStatus } from '../__generated__/gql/types';
import { AddTournamentCrossSVG, SubsribedSVG } from '../lib/data/svg-container';
import { FormattedTextWithUrls } from '../components/elements/formatted-text-url';

export default function IndexPage() {
  const { data: meResult, error: meError } = useMe()
  const { data: tournamentsResult, error: tournamentsError } = useTournaments()
  const { data: gamesResult, error: gamesError } = useGames()
  const { data: lanResult, error: lanError } = useLan()

  const gamesList = gamesResult?.games
  const user = meResult?.me

  if (!user) {
    return null
  }

  return (
    <>
      <Head>
        <title>{lanResult?.lan.name || ""} - Home</title>
      </Head>
      <div className='is-full-height is-flex is-flex-direction-column p-3'>
        {lanResult?.lan.motd &&
          <div className='flat-box has-background-secondary-level px-5 pb-5 mb-3'>
            <div className='is-title big'>MOT DU JOUR</div>
            <p className='enable-line-break'>
              <FormattedTextWithUrls text={lanResult?.lan.motd} />
            </p>
          </div>
        }
        <div className='is-title big has-background-secondary-level px-5 p-3'>TOURNOIS</div>
        <div className="flat-box has-background-secondary-level is-scrollable is-flex-grow-1 px-5 pt-0">
          <div className='homeTournamentsGrid'>
            {user?.isAdmin &&
              <Link href="/edit/new" className="flat-box homeTournamentBoxNew has-background-primary-accent is-flex is-justify-content-center is-align-items-center is-flex-direction-column is-clickable fade-on-mouse-out" data-id="editTournament">
                <AddTournamentCrossSVG />
                <div className='has-text-weight-semibold'>Créer un tournoi</div>
              </Link>
            }
            {tournamentsResult?.tournaments.map(tournament =>
              tournament && <IndexTournamentTile tournament={tournament} username={user.username} game={gamesList?.find(game => game.id == tournament.game)} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function IndexTournamentTile({tournament, username, game} : {tournament:TournamentLight, username: string, game: Game | undefined}) {
  const backgroundImage = game?.id == -1 ? '' : 'url(/api/static/igdb/' + game?.picture + '.jpg)'
  return (
    <Link href={`/tournaments/${tournament.id}`} key={tournament.id} className={`flat-box homeTournamentBox is-clickable p-0 ${game?.id == -1 ? 'has-generic-game-background-image' : ''}`} style={{backgroundImage: backgroundImage}}>
      <div className={`tournamentName ${tournament.status == TournamentStatus.Done && 'over'}`}>{tournament.name}</div>
      {tournament.players.find(player => player == username) &&
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