import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { Form, MetaFunction, useActionData, useLoaderData } from "@remix-run/react"
import { requireUserLoggedIn } from "~/lib/session.server"
import { adminLogin } from "./admin-login.queries.server"
import { getLan } from "~/lib/persistence/lan.server"
import { useEffect, useState } from "react"
import { notifyError } from "~/lib/components/notification"
import { EyeSVG } from "~/lib/components/data/svg-container"
import { useTranslation } from "react-i18next"

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
    const { t } = useTranslation()
    return (
        <div className="is-flex-col is-full-height align-center justify-center">
            <div className="is-flex-col align-center gap-3 has-background-secondary-level p-4">
                <div className="is-title big">404</div>
                <div className="is-title medium">{t("admin.mdp_non_renseigne")}</div>
            </div>
            <div className="">{t("admin.contacter_admin")}</div>
        </div >
    )
}

function AdminLoginForm() {
    const actionResult = useActionData<typeof action>()
    const [showPassword, setShowPassword] = useState(false)
    const { t } = useTranslation()

    useEffect(() => {
        if (actionResult?.error) {
            notifyError(t("admin.mauvais_mdp"))
            return
        }
    }, [actionResult])
    return (
        <div className="is-flex-col is-full-height align-center justify-center">
            <Form method="POST" className="p-4 has-background-secondary-level is-flex-col align-center gap-4 is-relative">
                <div>{t("admin.mdp_admin")}</div>
                <div className="is-flex align-center gap-2 has-background-primary-level">
                    {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                    <input id='password' name="password" autoFocus className="input is-radiusless has-background-primary-level" type={showPassword ? "text" : "password"} placeholder={t("login.mdp_placeholder")} required />
                    <div className="pr-2" onMouseEnter={() => setShowPassword(true)} onMouseLeave={() => setShowPassword(false)}><EyeSVG /></div>
                </div>
                <button type='submit' className="customButton has-background-primary-accent is-clickable">{t("boutons.confirmer")}</button>
            </Form >
        </div >
    )
}