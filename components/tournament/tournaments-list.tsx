import { TournamentStatus } from '../../__generated__/gql/types';
import { useGames, useMe, useTournaments } from '../../lib/hooks';
import Link from 'next/link'

interface TournamentsListProps {
    selected: string;
}

export default function TournamentsList({ selected }: TournamentsListProps) {
    
    const { data: meResult, error: meError } = useMe()
    const { data: tournamentsResult, error: tournamentsError } = useTournaments()
    const { data: gamesResult, error: gamesError } = useGames()

    const user = meResult?.me
    const gamesList = gamesResult?.games

    if (!user) {
        return null
    }

    return (
        <div className="tournamentsList flat-box is-flex is-flex-direction-column is-scrollable has-background-secondary-level mr-3">
            {user?.isAdmin &&
            <Link href="/edit/new" className={`tournamentTile has-background-primary-level is-clickable ${selected == "new" ? 'is-active' : ''}`}>
                <div className='tournamentName' >NOUVEAU TOURNOI</div>
            </Link>
            }

            {tournamentsResult?.tournaments.map(tournament =>
                <Link
                    href={`/tournaments/${tournament?.id}`}
                    key={tournament?.id}
                    className={`tournamentTile is-clickable ${tournament?.id === selected ? 'is-active' : ''} ${tournament.game == -1 ? 'has-generic-game-background-image' : '' } `}
                    style={{backgroundImage: tournament.game == -1 ? "" : 'url(/api/static/igdb/' + gamesList?.find(game => game.id == tournament.game)?.picture + '.jpg)'}}>
                    <div className='tournamentName'>{tournament?.name}</div>
                    {tournament.players.includes(user.username) && <div className='subscribedIndicator' title='inscrit'></div>}
                    {tournament?.status == TournamentStatus.Balancing && <div className='tournamentState'>En préparation</div>}
                    {tournament?.status == TournamentStatus.Paused && <div className='tournamentState'>En pause</div>}
                    {tournament?.status == TournamentStatus.Running && <div className='tournamentState'>En cours</div>}
                    {tournament?.status == TournamentStatus.Validating && <div className='tournamentState'>En validation</div>}
                    {tournament?.status == TournamentStatus.Done && <div className='tournamentState'>Terminé</div>}
                    {tournament.game != -1 && <div className='tournamentTilebackground'></div>}
                </Link>
            )}
        </div>
    )
}