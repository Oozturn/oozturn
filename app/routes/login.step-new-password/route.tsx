import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { getLan } from "~/lib/persistence/lan.server";
import { hasPassword, storePassword } from "~/lib/persistence/password.server";
import { getUsername, updateSessionWithPasswordAuth } from "~/lib/session.server";
import { validate } from "./validate";

export async function loader({ request }: LoaderFunctionArgs) {
  if (!getLan().authenticationNeeded) {
    throw redirect('/login');
  }

  const username = await getUsername(request)
  if (!username || (username && !hasPassword(username))) {
    throw redirect('/login');
  }
  return { username: username }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "").trim();
  const confirmPassword = String(formData.get("confirmPassword") || "").trim();

  let errors = await validate(password, confirmPassword);
  if (errors) {
    return json({ ok: false, errors }, 400);
  }

  const username = await getUsername(request) as string
  storePassword(username, password)

  const cookie = await updateSessionWithPasswordAuth(request)
  return redirect("/", {
    headers: {
      "Set-Cookie": cookie
    }
  })
}

export default function LoginStepNewPassword() {
  const { username } = useLoaderData<typeof loader>()
  let actionResult = useActionData<typeof action>();

  return <div className="is-flex is-flex-direction-column is-align-items-center">
    <div className="flat-box has-background-secondary-level is-full-width">
      <div className="has-text-centered mb-4 is-size-3">Bienvenue <i style={{ color: "var(--accent-primary-color)" }}>{username}</i> ! </div>
      <Form method="post">
        <div className="field">
          <label className="has-text-centered" htmlFor="username">Création du mot de passe :</label>
          <div className="control">
            <input
              id="password"
              name="password"
              className="mt-2 input is-radiusless"
              type="password"
              placeholder="Mot de passe"
              required
              autoFocus
              maxLength={18}
            />
          </div>
        </div>
        <div className="field">
          <label className="has-text-centered" htmlFor="username">Confirmation du mot de passe :</label>
          <div className="control">
            <input
              id="confirmPassword"
              name="confirmPassword"
              className="mt-2 input is-radiusless"
              type="password"
              required
              maxLength={18}
            />
          </div>
          {actionResult?.errors?.password && (
            <p className="help is-danger">
              {actionResult.errors.password}
            </p>
          )}
        </div>
        <div className="field mt-4">
          <div className="control">
            <button type='submit' className={`is-link my-0 is-radiusless is-borderless has-background-secondary-accent py-2 px-4 is-pulled-right`}>Se connecter</button>
          </div>
        </div>
      </Form>
    </div>
  </div>
}
