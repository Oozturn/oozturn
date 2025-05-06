import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { Form, MetaFunction, useActionData, useLoaderData } from "@remix-run/react"
import { requireUserLoggedIn } from "~/lib/session.server"
import { adminLogin } from "./admin-login.queries.server"
import { getLan } from "~/lib/persistence/lan.server"
import { useEffect, useState } from "react"
import { notifyError } from "~/lib/components/notification"
import { EyeSVG } from "~/lib/components/data/svg-container"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    return [
        { title: data?.lanName + " - Connexion admin" }
    ]
}

export async function loader({
    request
}: LoaderFunctionArgs): Promise<{
    lanName: string
    adminLoginNoPassword: boolean
}> {
    await requireUserLoggedIn(request)
    return { lanName: getLan().name, adminLoginNoPassword: !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === '' ? true : false }
}


export async function action({ request }: ActionFunctionArgs) {
    await requireUserLoggedIn(request)

    const body = await request.formData()
    return await adminLogin(String(body.get("password")), request)
}

export default function AdminLogin() {
    const data = useLoaderData<typeof loader>()
    if (data.adminLoginNoPassword) return <AdminLoginNoPassword />
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
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        if (actionResult?.error) {
            notifyError("Raté. Mais c'était bien tenté.")
            return
        }
    }, [actionResult])
    return (
        <div className="is-flex-col is-full-height align-center justify-center">
            <Form method="POST" className="p-4 has-background-secondary-level is-flex-col align-center gap-4 is-relative">
                <div>Mot de passe administrateur</div>
                <div className="is-flex align-center gap-2 has-background-primary-level">
                    {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                    <input id='password' name="password" autoFocus className="input is-radiusless has-background-primary-level" type={showPassword ? "text" : "password"} placeholder="Mot de passe" required />
                    <div className="pr-2" onMouseEnter={() => setShowPassword(true)} onMouseLeave={() => setShowPassword(false)}><EyeSVG /></div>
                </div>
                <button type='submit' className="customButton has-background-primary-accent is-clickable">Soumettre</button>
            </Form >
        </div >
    )
}