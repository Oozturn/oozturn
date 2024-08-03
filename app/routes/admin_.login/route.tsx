import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { Form, MetaFunction } from "@remix-run/react"
import { requireUserLoggedIn } from "~/lib/session.server"
import { adminLogin } from "./queries.server"
import { getLan } from "~/lib/persistence/lan.server"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    return [
        { title: data?.lanName + " - Connexion admin" }
    ]
}

export async function loader({
    request
}: LoaderFunctionArgs): Promise<{
    lanName: string
}> {
    await requireUserLoggedIn(request)
    return { lanName: getLan().name }
}


export async function action({ request }: ActionFunctionArgs) {
    await requireUserLoggedIn(request)

    const body = await request.formData()
    return await adminLogin(String(body.get("password")), request)
}

export default function AdminLogin() {

    return (
        <div className="is-flex-col is-full-height align-center justify-center">
            <Form method="POST" className="p-4 has-background-secondary-level is-flex-col align-center gap-4">
                <div>Mot de passe administrateur</div>
                {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                <input id='password' name="password" autoFocus className="input is-radiusless has-background-primary-level" type="password" placeholder="Mot de passe" required />
                <button type='submit' className="customButton has-background-primary-accent">Soumettre</button>
            </Form>
        </div>
    )
}