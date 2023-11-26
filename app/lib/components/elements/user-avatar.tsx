"use server"

import useLocalStorageState from "use-local-storage-state"
import { BaseAvatar } from "../tools/base-avatar"
import { useState } from "react"
import { accentsList } from "../data/themes"

interface UserAvatarProps {
	username: string
	avatar: string | null | undefined
}

async function isImgUrl(url: string) {
	return await fetch(url, {method: 'HEAD'})
		.then(res => {return res.headers.get('Content-Type')?.startsWith('image') == true})
		.catch(() => {return false})
}
  

export function UserAvatar({username, avatar}: UserAvatarProps) {
    const [accentLocalStorage, setAccentLocalStorage] = useLocalStorageState("accent", {defaultValue: "Switch"})
	const [ isImage, setIsImage ] = useState(false)
	isImgUrl(`/api/static/avatar/${avatar}`).then(res => setIsImage(res))

	return <>
		{avatar && isImage ?
			<img className="is-rounded" src={`/api/static/avatar/${avatar}`} alt=""/>
			:
			<BaseAvatar username={username} color={accentsList.find(accent => accent.name == accentLocalStorage)?.primary as string} size={128} />
		}
	</>
}