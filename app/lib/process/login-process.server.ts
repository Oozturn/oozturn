import { json, redirect } from "@remix-run/node"
import { logger } from "../logging/logging"
import { createSessionWithUsername } from "../session.server"



export async function doLogin(rawUsername: string) {
    const username = rawUsername.trim()

    if (username.length == 0) {
        return json({ error: "Nom d'utilisateur requis." })
    }

    if (username.length > 15) {
        return json({ error: "Nom d'utilisateur trop long (15 caratères max.)" })
    }

    // do things

    logger.info({ username: username }, `${username} logged in`)

    const cookie = await createSessionWithUsername(username)
    return redirect("/", {
        headers: {
            "Set-Cookie": cookie
        }
    })
}