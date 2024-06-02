import { hasPassword, resetPassword } from "~/lib/persistence/password.server"
import { requireUserAdmin } from "~/lib/session.server"


export async function resetUserPassword(request: Request, userId: string) {
    await requireUserAdmin(request)
    if (!userId) {
        console.error("[resetUserPassword] Missing userId")
    }
    if (hasPassword(userId)) {
        console.error(`[resetUserPassword] Reseting password of ${userId}`)
        resetPassword(userId)
    } else {
        console.error(`[resetUserPassword] ${userId} without password`)
    }
}