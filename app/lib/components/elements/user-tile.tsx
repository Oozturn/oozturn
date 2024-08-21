import { UserAvatar } from "./user-avatar"
import { useUsers } from "../contexts/UsersContext"
import { AvatarComponent } from "avatar-initials"
import { accentsList } from "../data/themes"
import useLocalStorageState from "use-local-storage-state"
import { ShinySVG } from "../data/svg-container"

interface UserTileProps {
    userId: string
    colorClass?: string
    customClass?: string
    height?: number
    maxLength?: number
    showTeam?: boolean
    initial?: string
    isShiny?: boolean
}
export function UserTileRectangle({ userId, colorClass, height, maxLength, showTeam, initial, isShiny }: UserTileProps) {
    const [accentLocalStorage,] = useLocalStorageState("accent", { defaultValue: "Switch" })
    const user = useUsers().find(user => (user.id == userId) || (user.username == userId))
    if (!user) {
        return null
    }
    showTeam = showTeam == false ? false : true
    height = height || 32
    maxLength = maxLength || 320
    if (maxLength < height)
        maxLength = 2 * height
    const maxTeamLength = (maxLength - height) * 1 / 3
    const maxUsernameLength = showTeam ? (maxLength - height) * 2 / 3 : maxLength - height
    return <div key={user.id} className={`is-flex grow gap-1 pr-3 align-center is-unselectable ${colorClass ? colorClass : ''}`} style={{ maxWidth: maxLength }}>
        <div className='is-flex'>
            {initial ?
                <AvatarComponent
                    useGravatar={false}
                    color="#B3FFFFFF"
                    background={accentsList.find(accent => accent.name == accentLocalStorage)?.primary as string}
                    initials={initial}
                    size={height}
                />
                :
                <UserAvatar username={user.username} avatar={user.avatar} size={height} />
            }
        </div>
        {isShiny && <div className="is-flex has-text-primary-accent"><ShinySVG /></div>}
        <div style={{ maxWidth: maxUsernameLength + "px", overflow: "hidden", textOverflow: "ellipsis" }}>{user.username}</div>
        {showTeam && user.team && <div className='fade-text' style={{ maxWidth: maxTeamLength + "px", overflow: "hidden", textOverflow: "ellipsis" }}>[{user.team}]</div>}
    </div>
}
interface FakeUserTileProps {
    userName: string
    initial?: string
    teamName?: string
    colorClass?: string
    customClass?: string
    height?: number
    maxLength?: number
}
export function FakeUserTileRectangle({ userName, initial, teamName, colorClass, height, maxLength }: FakeUserTileProps) {
    height = height || 32
    maxLength = maxLength || 320
    if (maxLength < height)
        maxLength = 2 * height
    const maxTeamLength = (maxLength - height) * 1 / 3
    const maxUsernameLength = teamName ? (maxLength - height) * 2 / 3 : maxLength - height
    return <div className={`is-flex grow gap-1 pr-3 align-center is-unselectable ${colorClass ? colorClass : ''}`} style={{ maxWidth: maxLength }}>
        <div className='is-flex'>
            <UserAvatar username={initial || userName} avatar={""} size={height} />
        </div>
        <div style={{ maxWidth: maxUsernameLength + "px", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
        {teamName && <div className='fade-text' style={{ maxWidth: maxTeamLength + "px", overflow: "hidden", textOverflow: "ellipsis" }}>[{teamName}]</div>}
    </div>
}

interface UserTileUsersPageProps extends UserTileProps {
    tournaments: number
    points: number
    leaderboardPlace: number
}
export function UserTileUsersPage({ userId, tournaments, points, leaderboardPlace }: UserTileUsersPageProps) {
    const user = useUsers().find(user => (user.id == userId) || (user.username == userId))
    if (!user) return null

    const [avatarHeight, minWidth] = [150, 260]

    return <div key={user.id} className="is-flex-col no-basis grow gap-2 p-3 align-stretch is-unselectable has-background-grey" style={{ minWidth: minWidth }}>
        <div className='is-flex justify-center'>
            <UserAvatar username={user.username} avatar={user.avatar} size={avatarHeight} />
        </div>
        <div className="is-flex-col grow gap-1 justify-center" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            <div className="is-title medium is-flex justify-center">{user.username}</div>
            {user.team && <div className='fade-text is-flex justify-center'>[{user.team}]</div>}
            <div className="is-flex-col align-stretch grow justify-center">
                <div className="is-flex gap-2 ">
                    <div className="has-text-right is-one-fifth">{tournaments}</div>
                    <div className="">tournois participés</div>
                </div>
                <div className="is-flex gap-2 ">
                    <div className="has-text-right is-one-fifth">{points}</div>
                    <div className="">Points gagnés</div>
                </div>
                <div className="is-flex">
                    <div className="has-text-right is-one-fifth">{leaderboardPlace}</div>
                    <div className=""><sup>{["ère", "nde"][leaderboardPlace - 1] ?? "ème"}</sup> place</div>
                </div>
            </div>
        </div>
    </div>
}