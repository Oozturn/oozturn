
import { AvatarComponent } from 'avatar-initials';

interface BaseAvatarProps {
    username: string
    color: string
    size: number
}
export function BaseAvatar({ username, color, size }: BaseAvatarProps) {

    return <AvatarComponent
        useGravatar={false}
        color="#B3FFFFFF"
        background={color}
        initials={`${username[0].toUpperCase()}`}
        size={size}
    />
}