import { json, redirect } from "@remix-run/node"
import { logger } from "../logging/logging"
import { getUsername, updateSessionWithAdminElevation } from "../session.server"


const adminPassword = process.env.ADMIN_PASSWORD

export async function adminLogin(rawPassword: string, request: Request) {
    const password = rawPassword.trim()
    if (!password || password != adminPassword) {
        logger.warn(`${getUsername(request)} tried to get admin rights with wrong password`)
        throw json({ error: "Mauvais mot de passe." })
    }

    const cookie = await updateSessionWithAdminElevation(request)
    return redirect("/admin", {
        headers : {
            "Set-Cookie" : cookie
        }
    })
}