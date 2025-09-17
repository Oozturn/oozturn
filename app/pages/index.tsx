import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Link } from "@remix-run/react"
import { useLan } from "~/lib/components/contexts/LanContext"
import { useTournaments } from "~/lib/components/contexts/TournamentsContext"
import { useUser } from "~/lib/components/contexts/UserContext"
import { AddTournamentCrossSVG, SubsribedSVG } from "~/lib/components/data/svg-container"
import { FormattedTextWithUrls } from "~/lib/components/elements/formatted-text-url"
import { requireUserLoggedIn } from "~/lib/session.server"
import { TournamentInfo, TournamentStatus } from "~/lib/tournamentEngine/types"
import { getLan } from "~/lib/persistence/lan.server"
import { useRevalidateOnGlobalTournamentUpdate } from "../api/sse.hook"
import { useTranslation } from "react-i18next"

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
  useRevalidateOnGlobalTournamentUpdate()
  const {t} = useTranslation()

  return (
    <>
      <div className='is-full-height is-flex-col p-3 is-clipped'>
        <div className='is-flex-col gap-3 is-scrollable'>
          {lan?.motd &&
            <div className='is-flex-col gap-3 has-background-secondary-level p-5'>
              <div className='is-title big pb-3'>{t("mot_du_jour")}</div>
              <p className='enable-line-break'>
                <FormattedTextWithUrls text={lan?.motd} />
              </p>
            </div>
          }
          <div className="grow has-background-secondary-level pr-2 py-5 pl-5 is-flex-col gap-5">
            <div className='is-title big'>{t("tournoi_pluriel")}</div>
            <div className="is-scrollable grow">
              <div className='homeTournamentsGrid pr-4'>
                {me?.isAdmin &&
                  <Link to="/tournaments/new" className="homeTournamentBox has-background-primary-accent is-flex-col justify-center align-center is-clickable fade-on-mouse-out" data-id="editTournament">
                    <AddTournamentCrossSVG />
                    <div className='has-text-weight-semibold'>{t("tournoi.creer")}</div>
                  </Link>
                }
                {tournaments.map(tournament =>
                  <IndexTournamentTile key={tournament.id} tournament={tournament} userId={me.id} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div >
    </>
  )
}

function IndexTournamentTile({ tournament, userId }: { tournament: TournamentInfo, userId: string }) {
  
  const {t} = useTranslation()
  return (

    <Link to={`/tournaments/${tournament.id}`} className="homeTournamentBox is-clickable p-0">
      <img className='is-full-height is-full-width' src={tournament.picture ? `/tournaments/${tournament.picture}` : "/none.webp"}
        style={{ position: "absolute", objectFit: "cover", backgroundImage: "var(--generic-game-image)", backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className={`tournamentName ${tournament.status == TournamentStatus.Done && 'over'}`}>{tournament.name}</div>
      {tournament.players.find(player => player.userId == userId) &&
        <div className='subscribed is-flex gap-2 align-center has-background-primary-accent'>
          <SubsribedSVG />
          <div className='cap-first no-basis'>{t("tournoi.inscrit")}</div>
        </div>
      }
      {[TournamentStatus.Balancing, TournamentStatus.Paused, TournamentStatus.Running, TournamentStatus.Validating].includes(tournament.status) &&
        <div className='status-bar'>{t(`tournoi.${tournament.status}`)}</div>
      }
      {tournament.status == TournamentStatus.Done &&
        <div className='over-overlay'>{t("tournoi.DONE")}</div>
      }
    </Link>
  )
}