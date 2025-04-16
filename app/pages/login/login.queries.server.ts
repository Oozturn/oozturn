import { json, redirect } from "@remix-run/node"
import { logger } from "~/lib/logging/logging"
import { getSettings } from "~/lib/settings.server"
import { getUserByUsername, registerNewUser, updateUser } from "~/lib/persistence/users.server"
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
        updateUser(user.id, {isAdmin: false})
        logger.info({ username: username }, `${username} logged in`)
    }
    else if (getSettings().security.newUsersByAdmin) {
        return json({ error: "Utilisateur inconnu." })
    } else {
        logger.info({ username: username }, `New user ${username} logged in`)
        user = registerNewUser(rawUsername)
    }

    const cookie = await createSessionWithUser(user)
    return redirect(getSettings().security.authentication ? "step-password" : "/", {
        headers: {
            "Set-Cookie": cookie
        }
    })
}