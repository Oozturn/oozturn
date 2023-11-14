import Link from "next/link";
import { useState } from "react";
import { useSWRConfig } from "swr"
import { GET_ME_QUERY } from "../../lib/gql/operations/operations";
import { cookieName } from "../../lib/session/config";
import { deleteCookie } from "cookies-next";
import { useLan, useLeaderboard, useMe } from "../../lib/hooks";
import { useRouter } from "next/router";
import EditProfileModal from "../user/edit-profile-modal";
import { DropDownArrowSVG, EditGearSVG, LogoFolded, LogoSideSVG } from "../../lib/data/svg-container";
import { UserAvatar } from "../elements/user-avatar";


export default function Navbar() {
    const { data: meResult, error: meError } = useMe()
    const { data: lanResult, error: lanError } = useLan()
    const [showMobileNav, setShowMobileNav] = useState(false)
    const router = useRouter()
    const [animateLogo, setAnimateLogo] = useState(false)

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    async function animateLogoFunc() {
        setAnimateLogo(true)
        await delay(2300)
        setAnimateLogo(false)
    }

    const loading = !meError && !meResult && !lanResult && !lanError

    const user = meResult?.me
    const lanName = lanResult?.lan.name
    const current_page = router.pathname

    return (
        <>
            <nav className="navbar has-background-secondary-level">
                <div className="navbar-brand is-title big">
                    <Link className="navbar-item pl-0" href="/">
                        <div style={{height:"25px", width:"180px"}} className="p-0 navbarLogo is-flex" onMouseEnter={animateLogoFunc}>
                            <LogoFolded animate={animateLogo} />
                        </div>
                        <LogoSideSVG />
                        {lanName}
                    </Link>
                </div>
                <div className={`navbar-menu ${showMobileNav && "is-active"}`}>
                    <div className="navbar-end">
                        {user?.isAdmin && <Link className={`navbar-item is-title medium is-uppercase is-tab px-0 mx-3 ${current_page == "/admin" ? 'is-active' : ''}`} href="/admin">Admin</Link>}
                        {user && <Link className={`navbar-item is-title medium is-uppercase is-tab px-0 mx-3 ${current_page == "/" ? 'is-active' : ''}`} href="/">Accueil</Link>}
                        {user && <Link className={`navbar-item is-title medium is-uppercase is-tab px-0 mx-3 ${current_page == "/results" ? 'is-active' : ''}`} href="/results">Résultats</Link>}
                        <div className="navbar-item m-4"></div>
                        {loading ? "" :
                            user ?
                                <PlayerProfile />
                                :
                                <></>
                        }
                    </div>
                </div>
            </nav >
        </>
    )
}

export function PlayerProfile() {
    const { mutate } = useSWRConfig()
    const router = useRouter()
    const [showEdit, setShowEdit] = useState(false)
    const { data: meResult } = useMe()
    const { data: leaderboardResult, error: leaderboardError } = useLeaderboard()

    
    const me = meResult?.me
    const leaderboard = leaderboardResult?.leaderboard

    if (!me) {
        return null
    }

    const handleLogout = async () => {
        deleteCookie(cookieName)
        await mutate(GET_ME_QUERY)
        router.push("/")
    }

    return (
        <>
            <div className="navbar-item navbar-user p-0 m-0 is-flex">
                <div className="navbar-item navbar-user-button is-clickable has-background-secondary-accent p-0 m-0 is-flex is-flex-grow-1">
                    <div className="username mr-4 is-flex-grow-1 has-text-centered">{me.username}</div>
                    <div className="arrow mr-4">
                        <DropDownArrowSVG />
                    </div>
                    <div className="avatar">
                        <UserAvatar username={me.username} avatar={me.avatar} />
                    </div>
                </div>
                <div className="flat-box navbarPlayerInfoTopBox has-background-secondary-level is-flex is-flex-direction-column is-align-items-center p-0">
                    <div className="settings is-clickable fade-on-mouse-out" onClick={() => setShowEdit(true)}>
                        <EditGearSVG />
                    </div>
                    <div className="avatar mt-6">
                        <UserAvatar username={me.username} avatar={me.avatar} />
                    </div>
                    <div>{me.username}</div>
                    {me.team && <div className="userteam fade-text">{'[' + me.team + ']'}</div>}
                    {leaderboard &&
                        <div className="is-flex is-full-width mt-5 is-align-items-end">
                            <div className="logout is-size-7 px-1 is-underlined is-clickable fade-on-mouse-out" onClick={handleLogout}>Se déconnecter</div>
                            <div className="is-flex-grow-1"></div>
                            <div className="is-flex points is-align-items-start">
                                <div>{leaderboard.find(p => p.player.username == me.username)?.points || 0}</div>
                                <div className="is-size-7 p-1">pts</div>
                            </div>
                        </div>
                    }
                    <div className="m-1"></div>
                    
                </div>
            </div>
            <EditProfileModal show={showEdit} onHide={() => setShowEdit(false)} />
        </>
    )
}