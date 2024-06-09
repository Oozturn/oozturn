import { useRect } from "@dnd-kit/core/dist/hooks/utilities"
import { hasPassword, resetPassword } from "~/lib/persistence/password.server"
import { getUserById, getUserByUsername } from "~/lib/persistence/users.server"
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

export async function renamePlayer(request:Request, userId:string, newUsername:string) {
    await requireUserAdmin(request)
    if (!userId) {
        console.error("[renamePlayer] Missing userId")
        return
    }
    if (!newUsername) {
        console.error("[renamePlayer] Missing newUsername")
        return
    }

    const existingUser = getUserByUsername(newUsername)
    if(existingUser && existingUser.id != userId) {
        console.error("[renamePlayer] Username taken")
        return
    }

    const user = getUserById(userId)
    user!.username = newUsername

    console.error(`[renamePlayer] Renaming ${userId} to ${newUsername}`)
}