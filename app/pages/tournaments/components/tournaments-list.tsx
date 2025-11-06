import { NavLink, useLocation } from "@remix-run/react"
import { useTournaments } from "~/lib/components/contexts/TournamentsContext"
import { useUser } from "~/lib/components/contexts/UserContext"
import { TournamentStatus } from "~/lib/tournamentEngine/types"
import { useRevalidateOnGlobalTournamentUpdate } from "~/api/sse.hook"
import { SubsribedSVG } from "~/lib/components/data/svg-container"


export default function TournamentsList() {
    useRevalidateOnGlobalTournamentUpdate()

    const user = useUser()
    const tournaments = useTournaments()
    
    const location = useLocation()
    if(location.pathname.endsWith("bracket")) return null

    return (
        <div className="tournamentsList is-flex is-flex-direction-column is-scrollable">
            {user.isAdmin &&
                <NavLink to="/tournaments/new" className={({ isActive }) => `tournamentTile has-background-secondary-level is-clickable ${isActive ? 'is-active' : ''}`}>
                    <div className='tournamentName' >NOUVEAU TOURNOI</div>
                </NavLink>
            }

            {tournaments.map(tournament =>
                <NavLink
                    to={`/tournaments/${tournament.id}`}
                    key={tournament.id}
                    className={({ isActive }) => `tournamentTile has-background-secondary-level is-clickable ${isActive ? 'is-active' : ''}`}
                >
                    <img alt="" className='is-full-height is-full-width' src={tournament.picture ? `/tournaments/${tournament.picture}` : "/none.webp"}
                        style={{ position: "absolute", objectFit: "cover", backgroundImage: "var(--generic-game-image)", backgroundSize: "cover", backgroundPosition: "center" }}
                    />
                    <div className='tournamentName'>{tournament.name}</div>
                    {tournament.players.find(p => p.userId == user.id) &&
                        <div className='subscribed mini is-flex align-center has-background-primary-accent' style={{ zIndex: tournament.status == TournamentStatus.Done ? 1 : 2 }}>
                            <SubsribedSVG />
                        </div>
                    }
                    {tournament.status == TournamentStatus.Balancing && <div className='tournamentState'>En préparation</div>}
                    {tournament.status == TournamentStatus.Paused && <div className='tournamentState'>En pause</div>}
                    {tournament.status == TournamentStatus.Running && <div className='tournamentState'>En cours</div>}
                    {tournament.status == TournamentStatus.Validating && <div className='tournamentState'>En validation</div>}
                    {tournament.status == TournamentStatus.Done && <div className='tournamentState'>Terminé</div>}
                    {tournament.picture != undefined && <div className='tournamentTilebackground'></div>}
                </NavLink>
            )}
        </div>
    )
}