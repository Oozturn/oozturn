import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, MetaFunction } from "@remix-run/react";
import { updateLan } from "~/lib/persistence/lan.server";
import { requireUserLoggedIn } from "~/lib/session.server";
import { adminLogin } from "./queries.server";
import { useLan } from "~/lib/components/contexts/LanContext";

export const meta: MetaFunction = () => {
    return [
        { title: useLan().name + " - Connexion admin" }
    ]
}

export async function loader({ request }: LoaderFunctionArgs) {
    await requireUserLoggedIn(request)
    return null
}

export async function action({ request }: ActionFunctionArgs) {
    await requireUserLoggedIn(request)

    const body = await request.formData()
    return await adminLogin(String(body.get("password")), request)
}

export default function AdminLogin() {

    return (
        <div className="is-full-height is-flex is-flex-direction-column is-align-items-center is-justify-content-space-around is-align-items-center">
            <Form method="POST" className="p-4 field has-background-secondary-level is-child is-4 is-flex is-flex-direction-column is-align-items-center">
                <div className="has-text-centered">Mot de passe administrateur</div>
                <input id='password' name="password" autoFocus className="input my-4 is-radiusless" type="password" placeholder="Mot de passe" required />
                <button type='submit' className="is-link my-0 is-radiusless is-borderless has-background-secondary-accent py-2 px-4 is-pulled-right">Soumettre</button>
            </Form>
        </div>
    )
}