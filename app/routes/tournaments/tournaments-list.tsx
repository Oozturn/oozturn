import { NavLink } from "@remix-run/react";
import { useTournaments } from "~/lib/components/contexts/TournamentsContext";
import { useUser } from "~/lib/components/contexts/UserContext";
import { useGames } from "~/lib/components/contexts/GamesContext";
import { TournamentStatus } from "~/lib/tournamentEngine/types";


export default function TournamentsList() {

    const user = useUser()
    const tournaments = useTournaments()
    const gamesList = useGames()

    return (
        <div className="tournamentsList flat-box is-flex is-flex-direction-column is-scrollable has-background-secondary-level">
            {user.isAdmin &&
                <NavLink to="/tournaments/new" className={({ isActive }) => `tournamentTile has-background-primary-level is-clickable ${isActive ? 'is-active' : ''}`}>
                    <div className='tournamentName' >NOUVEAU TOURNOI</div>
                </NavLink>
            }

            {tournaments.map(tournament =>
                <NavLink
                    to={`/tournaments/${tournament.id}`}
                    key={tournament.id}
                    className={({ isActive }) => `tournamentTile is-clickable ${isActive ? 'is-active' : ''}
                    ${tournament.game == undefined ? 'has-generic-game-background-image' : ''}`}
                    style={{ backgroundImage: tournament.game == undefined ? "" : 'url(/igdb/' + gamesList.find(game => game.id == tournament.game)?.picture + '.jpg)' }}>
                    <div className='tournamentName'>{tournament.name}</div>
                    {tournament.players.find(p => p.userId == user.id) && <div className='subscribedIndicator' title='inscrit'></div>}
                    {tournament.status == TournamentStatus.Balancing && <div className='tournamentState'>En préparation</div>}
                    {tournament.status == TournamentStatus.Paused && <div className='tournamentState'>En pause</div>}
                    {tournament.status == TournamentStatus.Running && <div className='tournamentState'>En cours</div>}
                    {tournament.status == TournamentStatus.Validating && <div className='tournamentState'>En validation</div>}
                    {tournament.status == TournamentStatus.Done && <div className='tournamentState'>Terminé</div>}
                    {tournament.game != undefined && <div className='tournamentTilebackground'></div>}
                </NavLink>
            )}
        </div>
    )
}