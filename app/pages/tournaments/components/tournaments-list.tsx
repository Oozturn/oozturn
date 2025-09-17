import { NavLink } from "@remix-run/react"
import { useTournaments } from "~/lib/components/contexts/TournamentsContext"
import { useUser } from "~/lib/components/contexts/UserContext"
import { TournamentStatus } from "~/lib/tournamentEngine/types"
import { useRevalidateOnGlobalTournamentUpdate } from "~/api/sse.hook"
import { SubsribedSVG } from "~/lib/components/data/svg-container"
import { useTranslation } from "react-i18next"


export default function TournamentsList() {
    useRevalidateOnGlobalTournamentUpdate()
    const {t} = useTranslation()

    const user = useUser()
    const tournaments = useTournaments()

    return (
        <div className="tournamentsList is-flex is-flex-direction-column is-scrollable">
            {user.isAdmin &&
                <NavLink to="/tournaments/new" className={({ isActive }) => `tournamentTile has-background-secondary-level is-clickable ${isActive ? 'is-active' : ''}`}>
                    <div className='tournamentName uppercase'>{t("tournoi.nouveau")}</div>
                </NavLink>
            }

            {tournaments.map(tournament =>
                <NavLink
                    to={`/tournaments/${tournament.id}`}
                    key={tournament.id}
                    className={({ isActive }) => `tournamentTile has-background-secondary-level is-clickable ${isActive ? 'is-active' : ''}`}
                >
                    <img className='is-full-height is-full-width' src={tournament.picture ? `/tournaments/${tournament.picture}` : "/none.webp"}
                        style={{ position: "absolute", objectFit: "cover", backgroundImage: "var(--generic-game-image)", backgroundSize: "cover", backgroundPosition: "center" }}
                    />
                    <div className='tournamentName'>{tournament.name}</div>
                    {tournament.players.find(p => p.userId == user.id) &&
                        <div className='subscribed mini is-flex align-center has-background-primary-accent' style={{ zIndex: tournament.status == TournamentStatus.Done ? 1 : 2 }}>
                            <SubsribedSVG />
                        </div>
                    }
                    {tournament.status != TournamentStatus.Open &&
                        <div className='tournamentState'>{t(`tournoi.${tournament.status}`)}</div>
                    }
                    {tournament.picture != undefined && <div className='tournamentTilebackground'></div>}
                </NavLink>
            )}
        </div>
    )
}