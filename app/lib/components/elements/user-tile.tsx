import { UserAvatar } from "./user-avatar"
import { useUsers } from "../contexts/UsersContext"

interface UserTileProps {
    userId: string
    colorClass?: string
    customClass?: string
    height?: number
    maxLength?: number
}
export function UserTileRectangle({ userId, colorClass, height, maxLength }: UserTileProps) {
    const user = useUsers().find(user => (user.id == userId) || (user.username == userId))
    if (!user) {
        return null
    }
    height = height || 32
    maxLength = maxLength || 320
    if (maxLength < height)
        maxLength = 2 * height
    const maxTeamLenght = (maxLength - height) * 1 / 3
    const maxUsernameLenght = (maxLength - height) * 2 / 3
    return <div key={user.id} className={`is-flex grow gap-1 pr-3 align-center is-unselectable ${colorClass ? colorClass : ''}`} style={{ maxWidth: maxLength }}>
        <div className='is-flex'>
            <UserAvatar username={user.username} avatar={user.avatar} size={height} />
        </div>
        <div style={{ maxWidth: maxUsernameLenght + "px", overflow: "hidden", textOverflow: "ellipsis" }}>{user.username}</div>
        {user.team && <div className='fade-text' style={{ maxWidth: maxTeamLenght + "px", overflow: "hidden", textOverflow: "ellipsis" }}>[{user.team}]</div>}
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