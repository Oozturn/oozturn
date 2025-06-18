import { redirect } from "react-router"
import { destroySession } from "~/lib/session.server"
import { Route } from "./+types/logout"


export async function action({ request }: Route.ActionArgs) {
    const cookie = await destroySession(request)
    return redirect("/login", {
        headers: {
            "Set-Cookie": cookie
        }
    })
}

export async function loader() {
    return redirect("/")
}