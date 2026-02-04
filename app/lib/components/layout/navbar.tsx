import { Link, useLocation, useSubmit } from "@remix-run/react"
import { useContext, useState } from "react"
import { useLan } from "../contexts/LanContext"
import { UserContext } from "../contexts/UserContext"
import { NotifySVG, DropDownArrowSVG, EditGearSVG, LogoFolded, LogoSideSVG } from "../data/svg-container"
import { UserAvatar } from "../elements/user-avatar"
import EditProfileModal from "../modals/edit-profile-modal"
import { clickorkey } from "~/lib/utils/clickorkey"
import { UserStats } from "~/lib/types/statistics"
import { useStats } from "../contexts/StatsContext"
import { usePlayableMatches } from "../contexts/PlayableMatchesContext"
import { IdToString } from "~/lib/utils/tournaments"
import { useTournaments } from "../contexts/TournamentsContext"

export default function Navbar() {
  const lan = useLan()
  const user = useContext(UserContext)
  const [showMobileNav] = useState(false)
  const [animateLogo, setAnimateLogo] = useState(false)
  const current_page: string = useLocation().pathname
  const loading = false

  if (current_page.endsWith("bracket")) return null

  if (!user) return null

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))
  async function animateLogoFunc() {
    setAnimateLogo(true)
    await delay(2300)
    setAnimateLogo(false)
  }

  return (
    <>
      <nav className="navbar has-background-secondary-level">
        <div className="navbar-brand is-title big">
          <Link className="navbar-item pl-0" to="/">
            <div
              style={{ height: "25px", width: "180px" }}
              className="p-0 navbarLogo is-flex"
              onMouseEnter={animateLogoFunc}
            >
              <LogoFolded animate={animateLogo} />
            </div>
            <LogoSideSVG />
            {lan?.name}
          </Link>
        </div>
        <NotificationCenter />
        <div className={`navbar-menu ${showMobileNav && "is-active"}`}>
          <div className="navbar-end">
            {user?.isAdmin && (
              <Link
                className={`navbar-item is-title medium is-uppercase is-tab px-0 mx-3 ${
                  current_page == "/admin" ? "is-active" : ""
                }`}
                to="/admin"
              >
                Admin
              </Link>
            )}
            {user && (
              <Link
                className={`navbar-item is-title medium is-uppercase is-tab px-0 mx-3 ${
                  current_page == "/" ? "is-active" : ""
                }`}
                to="/"
              >
                Accueil
              </Link>
            )}
            {user && (
              <Link
                className={`navbar-item is-title medium is-uppercase is-tab px-0 mx-3 ${
                  current_page == "/info" ? "is-active" : ""
                }`}
                to="/info"
              >
                Infos
              </Link>
            )}
            {user && (
              <Link
                className={`navbar-item is-title medium is-uppercase is-tab px-0 mx-3 ${
                  current_page == "/results" ? "is-active" : ""
                }`}
                to="/results"
              >
                Résultats
              </Link>
            )}
            <div className="navbar-item m-4"></div>
            {loading ? "" : user ? <UserProfile /> : <></>}
          </div>
        </div>
      </nav>
    </>
  )
}

function NotificationCenter() {
  const playableMatches = usePlayableMatches()
  const tournaments = useTournaments()

  if (playableMatches.length == 0) {
    return null
  }

  return (
    <div className="navbar-notifications fade-on-mouse-out navbar-item p-0 m-0 is-flex-col align-stretch">
      <div className="grow is-flex justify-center align-center">
        <NotifySVG />
      </div>
      <div className="navbarNotificationCenter has-background-secondary-level is-flex-col align-stretch">
        <div
          id="waitingMatchesTitle"
          className="is-flex align-center justify-center p-2 is-uppercase has-background-primary-accent has-text-weight-semibold"
        >
          Matchs en attente
        </div>
        <div id="waitingMatchesList" className="is-flex-col align-stretch gap-1">
          {playableMatches.map((match) => (
            <Link
              key={match.tournamentId + "_" + IdToString(match.matchId)}
              to={`/tournaments/${match.tournamentId}`}
              className="m-2 is-flex align-center gap-3 fade-on-mouse-out"
            >
              <span style={{ letterSpacing: -5 }}>
                <i className="has-text-secondary-accent">/</i>
                <i className="has-text-primary-accent">/</i>
              </span>
              <span className="is-uppercase">{tournaments.find((t) => t.id == match.tournamentId)?.name}</span> - Match{" "}
              {IdToString(match.matchId)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function UserProfile() {
  const submit = useSubmit()
  const me = useContext(UserContext)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userStats: UserStats | undefined = useStats().usersStats.find((us) => us.userId == me?.id)
  const [showEdit, setShowEdit] = useState(false)

  if (!me) {
    return null
  }

  function handleLogout() {
    submit(null, {
      action: "/logout",
      method: "POST"
    })
  }

  return (
    <>
      <div className="navbar-item navbar-user p-0 m-0 is-flex">
        <div className="navbar-item navbar-user-button is-clickable has-background-secondary-accent p-0 m-0 is-flex grow gap-4">
          <div className="username grow has-text-centered">{me.username}</div>
          <div className="arrow">
            <DropDownArrowSVG />
          </div>
          <UserAvatar username={me.username} avatar={me.avatar} size={56} />
        </div>
        <div className="navbarUserInfoTopBox has-background-secondary-level is-flex-col align-center p-0">
          <div
            className="is-align-self-flex-end mr-4 mt-3 is-clickable fade-on-mouse-out"
            {...clickorkey(() => setShowEdit(true))}
          >
            <EditGearSVG />
          </div>
          <UserAvatar username={me.username} avatar={me.avatar} size={96} />
          <div>{me.username}</div>
          {me.team && <div className="fade-text">{"[" + me.team + "]"}</div>}
          <div className="is-flex is-full-width mt-5 align-end">
            <div className="is-size-7 px-1 is-underlined is-clickable fade-on-mouse-out" {...clickorkey(handleLogout)}>
              Se déconnecter
            </div>
            <div className="grow"></div>
            {userStats && (
              <div className="is-flex points align-start">
                <div>{userStats.globalTournamentPoints || 0}</div>
                <div className="is-size-7 p-1">pts</div>
              </div>
            )}
          </div>
          <div className="m-1"></div>
        </div>
      </div>
      <EditProfileModal show={showEdit} onHide={() => setShowEdit(false)} />
    </>
  )
}
