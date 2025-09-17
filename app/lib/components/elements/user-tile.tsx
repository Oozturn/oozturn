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
    isForfeit?: boolean
}
export function UserTileRectangle({ userId, colorClass, height, maxLength, showTeam, initial, isShiny, isForfeit }: UserTileProps) {
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
    const maxUsernameLength = showTeam ? (maxLength - height) * 2 / 3 : (maxLength - height) - 8
    return <div key={user.id} className={`is-flex grow gap-1 align-center justify-stretch is-unselectable ${colorClass ? colorClass : ''}`} style={{ maxWidth: maxLength }}>
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
        {isShiny && <div className="is-flex has-text-primary-accent"><ShinySVG /></div>}
        <div style={{ maxWidth: maxUsernameLength + "px", overflow: "hidden", textOverflow: "ellipsis" }}>{isForfeit ? <s>{user.username}</s> : user.username}</div>
        {showTeam && user.team && <div className='grow no-basis fade-text' style={{ maxWidth: maxTeamLength + "px", overflow: "hidden", textOverflow: "ellipsis", textWrap: "nowrap" }}>[{user.team}]</div>}
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
    const maxUsernameLength = teamName ? (maxLength - height) * 2 / 3 : (maxLength - height) - 8
    return <div className={`is-flex gap-1 align-center justify-stretch is-unselectable ${colorClass ? colorClass : ''}`} style={{ maxWidth: maxLength, textAlign: "initial" }}>
        <div className='is-flex'>
            <UserAvatar username={initial || userName} avatar={""} size={height} />
        </div>
        <div style={{ maxWidth: maxUsernameLength + "px", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
        {teamName && <div className='fade-text' style={{ maxWidth: maxTeamLength + "px", overflow: "hidden", textOverflow: "ellipsis", textWrap: "nowrap" }}>[{teamName}]</div>}
    </div>
}
