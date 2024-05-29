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
        {user.team && <div className='fade-text' style={{ maxWidth: maxTeamLenght + "px", overflow: "hidden", textOverflow: "ellipsis" }}>[{user.team}]</div>}
        <div style={{ maxWidth: maxUsernameLenght + "px", overflow: "hidden", textOverflow: "ellipsis" }}>{user.username}</div>
    </div>
}