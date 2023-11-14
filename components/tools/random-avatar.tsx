
import { AvatarComponent } from 'avatar-initials';
import randomColor from 'randomcolor';

interface RandomAvatarProps {
    username: string
}
export function RandomAvatar({ username }: RandomAvatarProps) {

    const color = randomColor({luminosity: 'light', seed: username})
    const background = randomColor({luminosity: 'dark', seed: username})

    return <AvatarComponent
        useGravatar={false}
        color={color}
        background={background}
        initials={`${username[0].toUpperCase()}`}
        size={128}
    />
}