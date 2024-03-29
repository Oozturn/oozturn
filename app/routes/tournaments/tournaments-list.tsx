import { Link, NavLink } from "@remix-run/react";
import { useContext } from "react";
import { UserContext } from "~/lib/components/contexts/UserContext";
import { Game } from "~/lib/types/games";
import { TournamentInfo, TournamentStatus } from "~/lib/types/tournaments";


export default function TournamentsList() {
    
    const isAdmin = true
    const user = useContext(UserContext);
    const tournaments : TournamentInfo[] = []
    const gamesList : Game[] = []

    if(!user) {
        return null
    }

    return (
        <div className="tournamentsList flat-box is-flex is-flex-direction-column is-scrollable has-background-secondary-level mr-3">
            {isAdmin &&
                <NavLink to="new" className={({ isActive }) => `tournamentTile has-background-primary-level is-clickable ${isActive ? 'is-active' : ''}`}>
                    <div className='tournamentName' >NOUVEAU TOURNOI</div>
                </NavLink>
            }

            {tournaments.map(tournament =>
                <NavLink
                    to={`${tournament?.id}`}
                    key={tournament?.id}
                    className={({ isActive }) => `tournamentTile is-clickable 
                    ${isActive ? 'is-active' : ''} 
                    ${tournament.game == -1 ? 'has-generic-game-background-image' : ''}`}
                    style={{ backgroundImage: tournament.game == -1 ? "" : 'url(/api/static/igdb/' + gamesList?.find(game => game.id == tournament.game)?.picture + '.jpg)' }}>
                    <div className='tournamentName'>{tournament?.name}</div>
                    {tournament.players.find(p => p.playername = user.username) && <div className='subscribedIndicator' title='inscrit'></div>}
                    {tournament?.status == TournamentStatus.Balancing && <div className='tournamentState'>En préparation</div>}
                    {tournament?.status == TournamentStatus.Paused && <div className='tournamentState'>En pause</div>}
                    {tournament?.status == TournamentStatus.Running && <div className='tournamentState'>En cours</div>}
                    {tournament?.status == TournamentStatus.Validating && <div className='tournamentState'>En validation</div>}
                    {tournament?.status == TournamentStatus.Done && <div className='tournamentState'>Terminé</div>}
                    {tournament.game != -1 && <div className='tournamentTilebackground'></div>}
                </NavLink>
            )}
        </div>
    )
}