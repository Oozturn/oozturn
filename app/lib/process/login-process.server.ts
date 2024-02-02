import { json, redirect } from "@remix-run/node"
import { logger } from "../logging/logging"
import { createSessionWithUsername } from "../session.server"
import { getUser, registerNewUser } from "../persistence/users.server"



export async function doLogin(rawUsername: string) {
    const username = rawUsername.trim()

    if (username.length == 0) {
        return json({ error: "Nom d'utilisateur requis." })
    }

    if (username.length > 15) {
        return json({ error: "Nom d'utilisateur trop long (15 caratères max.)" })
    }

    // If user exists, recover it from global. Else, register it
    let user = getUser(rawUsername.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''))
    if (user) {
        logger.info({ username: username }, `${username} logged in`)
    }
    else {
        logger.info({ username: username }, `New user ${username} logged in`)
        user = registerNewUser(rawUsername)
    }

    const cookie = await createSessionWithUsername(user.username)
    return redirect("/", {
        headers: {
            "Set-Cookie": cookie
        }
    })
}