import { ActionFunctionArgs } from "@remix-run/node"
import { updateUser } from "~/lib/persistence/users.server"
import { getUsername, requireUserLoggedIn } from "~/lib/session.server"
import { removeAvatar, setAvatar } from "./queries"

export enum Intents {
    UPDATE_TEAM = 'update-team',
    UPLOAD_AVATAR = 'upload-avatar',
    REMOVE_AVATAR = 'remove-avatar'
}

export async function action({ request }: ActionFunctionArgs) {
    requireUserLoggedIn(request)

    const formData = await request.formData()
    const intent = formData.get("intent")
    const username = await getUsername(request)
    if(!username) {
        return
    }

    switch (intent) {
        case Intents.UPDATE_TEAM:
            updateUser(username,
                {
                    team: String(formData.get("team"))
                })
            break;
        case Intents.UPLOAD_AVATAR:
            await setAvatar(username, formData.get("avatar") as File)
            break;
        case Intents.REMOVE_AVATAR:
            await removeAvatar(username)
            break;

    }

    return null
}