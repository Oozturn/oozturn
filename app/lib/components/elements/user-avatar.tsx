"use server"

import useLocalStorageState from "use-local-storage-state"
import { BaseAvatar } from "../tools/base-avatar"
import { accentsList } from "../data/themes"

interface UserAvatarProps {
	username: string
	avatar: string | null | undefined
	size?: number
}

export function UserAvatar({ username, avatar, size }: UserAvatarProps) {
	const [accentLocalStorage, ] = useLocalStorageState("accent", { defaultValue: "Switch" })
	return <>
		{avatar ?
			<img className="is-rounded" src={`/avatar/${avatar}`} alt="Avatar" width={size ? size : 128} />
			:
			<BaseAvatar username={username} color={accentsList.find(accent => accent.name == accentLocalStorage)?.primary as string} size={size ? size : 128} />
		}
	</>
}