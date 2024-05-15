import { UserAvatar } from "./user-avatar"
import { useUsers } from "../contexts/UsersContext"

interface UserTileProps {
    username: string
    colorClass?: string
    height?: number
}
export function UserTileRectangle({ username, colorClass, height }: UserTileProps) {
    const user = useUsers().find(user => (user.id == username) || (user.username == username))
    if (!user) {
        return null
    }
    return <div key={user.username} className={`is-flex gap-3 pr-3 is-align-items-center is-unselectable ${colorClass ? colorClass : ''}`}>
        <div className='is-flex'>
            <UserAvatar username={user.username} avatar={user.avatar} size={height? height : 32} />
        </div>
        {user.team && <div className='fade-text' style={{maxWidth:"90px", overflow:"hidden", textOverflow: "ellipsis"}}>[{user.team}]</div>}
        <div style={{maxWidth:"200px", overflow:"hidden", textOverflow: "ellipsis"}}>{user.username}</div>
    </div>

}