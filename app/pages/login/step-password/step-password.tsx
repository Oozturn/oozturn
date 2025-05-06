import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from "@remix-run/node"
import { Form, useActionData, useLoaderData } from "@remix-run/react"
import { useEffect, useRef, useState } from "react"
import { EyeSVG, LogoUnfolded } from "~/lib/components/data/svg-container"
import { CustomButton } from "~/lib/components/elements/custom-button"
import { getLan } from "~/lib/persistence/lan.server"
import { checkPassword, hasPassword } from "~/lib/persistence/password.server"
import { getUserId, updateSessionWithPasswordAuth } from "~/lib/session.server"
import { notifyError } from "~/lib/components/notification"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.lanName + " - Connexion" }
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (process.env.AUTHENTICATION === 'false') {
    throw redirect('/login')
  }

  const username = await getUserId(request)
  if (!username) {
    throw redirect('/login')
  }
  if (!hasPassword(username)) {
    throw redirect('../step-new-password')
  }
  return { username: username, lanName: getLan().name }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const password = String(formData.get("password") || "").trim()
  const username = await getUserId(request) as string

  const errors: { password?: string } = {}

  if (!checkPassword(username, password)) {
    errors.password = "Mot de passe incorrect"
  }

  if (Object.keys(errors).length) {
    return json({ ok: false, errors }, 400)
  }

  const cookie = await updateSessionWithPasswordAuth(request)
  return redirect("/", {
    headers: {
      "Set-Cookie": cookie
    }
  })
}

export default function LoginStepPassword() {
  const { username } = useLoaderData<typeof loader>()
  const actionResult = useActionData<typeof action>()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const formRef = useRef(null)

  useEffect(() => {
    if (actionResult?.errors?.password) {
      notifyError(actionResult.errors.password)
      return
    }
  }, [actionResult])

  return (
    <div className="is-flex-col align-center justify-center is-relative">
      <div className="loginLogo" style={{ width: "50vw" }}>
        <LogoUnfolded animate={true} folded={true} />
      </div>
      <div className="is-flex-col align-center gap-5 p-4 has-background-secondary-level " style={{ maxWidth: "50vw" }}>
        <div className="has-text-centered is-size-3">Bienvenue <i style={{ color: "var(--accent-primary-color)" }}>{username}</i> ! </div>
        <Form ref={formRef} method="post" className="is-flex-col gap-6 is-full-width align-stretch">
          <div className="is-flex-col align-stretch gap-2">
            <div>Mot de passe :</div>
            <div className="is-flex align-center gap-2 has-background-primary-level">
              <input
                id="password"
                name="password"
                className="input grow no-basis has-text-centered has-background-primary-level"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                required
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') { !password && e.preventDefault() } }}
              />
              <div className="pr-2" onMouseEnter={() => setShowPassword(true)} onMouseLeave={() => setShowPassword(false)}><EyeSVG /></div>
            </div>
          </div>
          <CustomButton
            active={!!password}
            colorClass="has-background-secondary-accent"
            customClasses="is-align-self-flex-end"
            callback={() => formRef.current && (formRef.current as HTMLFormElement).submit()}
            contentItems={["Se connecter"]}
          />
        </Form>
      </div>
    </div>
  )
}
