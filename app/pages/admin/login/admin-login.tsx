import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { Form, MetaFunction, useActionData } from "@remix-run/react"
import { requireUserLoggedIn } from "~/lib/session.server"
import { adminLogin } from "./admin-login.queries.server"
import { getLan } from "~/lib/persistence/lan.server"
import lanConfig from "config.json"

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
    if (!lanConfig.security.admin_password) return <AdminLoginNoPassword />
    return <AdminLoginForm />
}

function AdminLoginNoPassword() {
    return (
        <div className="is-flex-col is-full-height align-center justify-center">
            <div className="is-flex-col align-center gap-3 has-background-secondary-level p-4">
                <div className="is-title big">404</div>
                <div className="is-title medium">Mot de passe administrateur non renseigné</div>
            </div>
            <div className="">Contacte un vrai admin pour qu&apos;il résolve le problème</div>
        </div >
    )
}

function AdminLoginForm() {
    const actionResult = useActionData<typeof action>()
    return (
        <div className="is-flex-col is-full-height align-center justify-center">
            <Form method="POST" className="p-4 has-background-secondary-level is-flex-col align-center gap-4 is-relative">
                <div>Mot de passe administrateur</div>
                {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                <input id='password' name="password" autoFocus className="input is-radiusless has-background-primary-level" type="password" placeholder="Mot de passe" required />
                <button type='submit' className="customButton has-background-primary-accent">Soumettre</button>
                {actionResult?.error && (
                    <p className="fade-text" style={{ position: "absolute", bottom: "-2rem", width: "500%", textAlign: "center" }}>
                        Raté. Mais c&apos;était bien tenté.
                    </p>
                )}
            </Form>
        </div>
    )
}