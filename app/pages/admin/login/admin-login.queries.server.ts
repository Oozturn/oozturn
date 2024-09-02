import { json, redirect } from "@remix-run/node"
import { logger } from "~/lib/logging/logging"
import { updateUser } from "~/lib/persistence/users.server"
import { getUserId, updateSessionWithAdminElevation } from "~/lib/session.server"
import lanConfig from "config.json"
import { compareHash } from "~/lib/persistence/password.server"

export async function adminLogin(rawPassword: string, request: Request) {
    const password = rawPassword.trim()
    if (!compareHash(password, lanConfig.security.admin_password)) {
        logger.warn(`${await getUserId(request)} tried to get admin rights with wrong password`)
        return json({ error: "Wrong password." }, 400)
    }
    updateUser(String(await getUserId(request)), { isAdmin: true })

    const cookie = await updateSessionWithAdminElevation(request)
    return redirect("/admin", {
        headers: {
            "Set-Cookie": cookie
        }
    })
}