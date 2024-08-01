import { ActionFunctionArgs, redirect } from "@remix-run/node"
import { destroySession } from "~/lib/session.server"


export async function action({ request }: ActionFunctionArgs) {
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