import { ActionFunctionArgs } from "@remix-run/node"
import { removeAvatar, setAvatar } from "./queries.server"
import { requireUserLoggedIn } from "~/lib/session.server"
import { updateUser } from "~/lib/persistence/users.server"

export enum Intents {
    UPDATE_TEAM = 'update-team',
    UPLOAD_AVATAR = 'upload-avatar',
    REMOVE_AVATAR = 'remove-avatar'
}

export async function action({ request }: ActionFunctionArgs) {
    const userId = await requireUserLoggedIn(request)
    const formData = await request.formData()
    const intent = formData.get("intent")

    switch (intent) {
        case Intents.UPDATE_TEAM:
            updateUser(userId,
                {
                    team: String(formData.get("team"))
                })
            break
        case Intents.UPLOAD_AVATAR:
            await setAvatar(userId, formData.get("avatar") as File)
            break
        case Intents.REMOVE_AVATAR:
            await removeAvatar(userId)
            break

    }

    return null
}