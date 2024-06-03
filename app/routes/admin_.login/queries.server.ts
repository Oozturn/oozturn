import { json, redirect } from "@remix-run/node"
import { logger } from "~/lib/logging/logging"
import { updateUser } from "~/lib/persistence/users.server"
import { getUserId, updateSessionWithAdminElevation } from "~/lib/session.server"


const adminPassword = process.env.ADMIN_PASSWORD

export async function adminLogin(rawPassword: string, request: Request) {
    const password = rawPassword.trim()
    if (!password || password != adminPassword) {
        logger.warn(`${await getUserId(request)} tried to get admin rights with wrong password`)
        throw json({ error: "Wrong password." })
    }
    updateUser(String(await getUserId(request)), {isAdmin: true})

    const cookie = await updateSessionWithAdminElevation(request)
    return redirect("/admin", {
        headers: {
            "Set-Cookie": cookie
        }
    })
}