import { json, redirect } from "@remix-run/node"
import { logger } from "~/lib/logging/logging"
import { getLan } from "~/lib/persistence/lan.server"
import { getUserByUsername, registerNewUser } from "~/lib/persistence/users.server"
import { createSessionWithUser } from "~/lib/session.server"

export async function doLogin(rawUsername: string) {
    const username = rawUsername.trim()
    if (username.length == 0) {
        return json({ error: "Nom d'utilisateur requis." })
    }

    if (username.length > 15) {
        return json({ error: "Nom d'utilisateur trop long (15 caratères max.)" })
    }

    let user = getUserByUsername(username)
    // If user exists, recover it from global. Else, register it
    if (user) {
        logger.info({ username: username }, `${username} logged in`)
    }
    else if(getLan().newUsersByAdminOnly)  {
        return json({ error: "Utilisateur inconnu." })
    } else {
        logger.info({ username: username }, `New user ${username} logged in`)
        user = registerNewUser(rawUsername)
    }

    const cookie = await createSessionWithUser(user)
    return redirect(getLan().authenticationNeeded ? "step-password" : "/", {
        headers: {
            "Set-Cookie": cookie
        }
    })
}