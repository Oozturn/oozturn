import { ActionFunctionArgs } from "@remix-run/node"
import { updateUser } from "~/lib/persistence/users.server"
import { getUsername } from "~/lib/session.server"

export enum Intents {
    UPDATE_TEAM = 'update-team',
}

export async function action({ request }: ActionFunctionArgs) {

    const formData = await request.formData()
    const intent = formData.get("intent")

    switch (intent) {
        case Intents.UPDATE_TEAM:
            updateUser(String(await getUsername(request)),
                {
                    team: String(formData.get("team"))
                })
            break;
    }

    return null
}