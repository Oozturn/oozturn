import { json, redirect } from "@remix-run/node"
import { logger } from "~/lib/logging/logging"
import { updateUser } from "~/lib/persistence/users.server"
import { getUserFromRequest, getUserId, updateSessionWithAdminElevation } from "~/lib/session.server"

export async function adminLogin(rawPassword: string, request: Request) {
    const password = rawPassword.trim()
    if (!(password === process.env.ADMIN_PASSWORD)) {
        logger.warn(`${await getUserId(request)} tried to get admin rights with wrong password`)
        return json({ error: "Wrong password." }, 400)
    }
    const user = await getUserFromRequest(request)
    if (!user) {
        return json({ error: "User not found." }, 400)
    }
    updateUser(user.id, { isAdmin: true })

    logger.debug(`User ${user.id} (${user.username}) granted admin rights`)

    const cookie = await updateSessionWithAdminElevation(request)
    return redirect("/admin", {
        headers: {
            "Set-Cookie": cookie
        }
    })
}