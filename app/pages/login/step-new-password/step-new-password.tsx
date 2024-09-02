import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from "@remix-run/node"
import { Form, useActionData, useLoaderData } from "@remix-run/react"
import { getLan } from "~/lib/persistence/lan.server"
import { storePassword } from "~/lib/persistence/password.server"
import { getUserFromRequest, getUserId, updateSessionWithPasswordAuth } from "~/lib/session.server"
import { validate } from "./step-new-password.validate"
import { useRef, useState } from "react"
import { CustomButton } from "~/lib/components/elements/custom-button"
import lanConfig from "config.json"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.lanName + " - Nouveau mot de passe" }
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!lanConfig.security.authentication_needed) {
    throw redirect('/login')
  }

  const user = await getUserFromRequest(request)
  if (!user) {
    throw redirect('/login')
  }
  return { ...user, lanName: getLan().name }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const password = String(formData.get("password") || "").trim()
  const confirmPassword = String(formData.get("confirmPassword") || "").trim()

  if (lanConfig.security.secure_users_password) {
    const errors = await validate(password, confirmPassword)
    if (errors) {
      return json({ ok: false, errors }, 400)
    }
  }

  const userId = await getUserId(request) as string
  storePassword(userId, password)

  const cookie = await updateSessionWithPasswordAuth(request)
  return redirect("/", {
    headers: {
      "Set-Cookie": cookie
    }
  })
}

export default function LoginStepNewPassword() {
  const { username } = useLoaderData<typeof loader>()
  const actionResult = useActionData<typeof action>()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const formRef = useRef(null)

  return (
    <div className="is-flex-col align-center justify-center is-relative">
      <div className="is-flex-col align-center gap-5 p-4 has-background-secondary-level " style={{ maxWidth: "50vw" }}>
        <div className="has-text-centered is-size-3">Crée ton mot de passe, <i style={{ color: "var(--accent-primary-color)" }}>{username}</i> ! </div>
        <Form ref={formRef} method="post" className="is-flex-col gap-4 is-full-width align-stretch">
          <div className="is-flex-col align-center gap-é">
            <div>Création du mot de passe :</div>
            <input
              id="password"
              name="password"
              className="input grow no-basis has-text-centered has-background-primary-level"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              maxLength={18}
              title={"18 caractères max." + lanConfig.security.secure_users_password ? " doit contenir au moins 1 de chaque : minuscule / majuscule / nombre / charcactère spécial": ""}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); !!password && document.getElementById("confirmPassword")?.focus() } }}
            />
          </div>
          <div className="is-flex-col align-center gap-2">
            <div>Confirmation du mot de passe :</div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              className={`input grow no-basis has-text-centered has-background-primary-level ${(password != confirmPassword) ? 'wrongConfirmPassword' : ''}`}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              // eslint-disable-next-line jsx-a11y/no-autofocus
              maxLength={18}
              onKeyDown={(e) => { if (e.key === 'Enter') { !password && e.preventDefault() } }}
            />
          </div>
          <CustomButton
            active={!!password && password == confirmPassword}
            colorClass="has-background-secondary-accent"
            customClasses="is-align-self-flex-end"
            callback={() => formRef.current && (formRef.current as HTMLFormElement).submit()}
            contentItems={["Se connecter"]}
          />
        </Form>
      </div>
      {actionResult?.errors?.password && (
        <p className="has-text-danger" style={{ position: "absolute", bottom: "-2rem", width: "500%", textAlign: "center" }}>
          {actionResult.errors.password}
        </p>
      )}
    </div>
  )
}
