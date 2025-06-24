import { redirect } from "react-router"
import { Form, useActionData, useLocation } from "react-router"
import { storePassword } from "~/lib/persistence/password.server"
import { getUserFromRequest, getUserId, updateSessionWithPasswordAuth } from "~/lib/session.server"
import { validate } from "./step-new-password.validate"
import { useEffect, useRef, useState } from "react"
import { CustomButton } from "~/lib/components/elements/custom-button"
import { useSettings } from "~/lib/components/contexts/SettingsContext"
import { notifyError } from "~/lib/components/notification"
import { EyeSVG, InfoSVG } from "~/lib/components/data/svg-container"
import { User } from "~/lib/types/user"
import { Route } from "./+types/step-new-password"
import { useUser } from "~/lib/components/contexts/UserContext"

export async function loader({ request }: Route.LoaderArgs) {
  if (process.env.AUTHENTICATION === 'false') {
    throw redirect('/login')
  }

  const user = await getUserFromRequest(request)
  if (!user) {
    throw redirect('/login')
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const password = String(formData.get("password") || "").trim()
  const confirmPassword = String(formData.get("confirmPassword") || "").trim()

  const errors = await validate(password, confirmPassword)
  if (errors) {
    return { ok: false, errors }
  }

  const userId = await getUserId(request) as string
  storePassword(userId, password)
  
  const user = await getUserFromRequest(request) as User
  const userIsComplete = (user.seat != '') && (user.team != '')
  const cookie = await updateSessionWithPasswordAuth(request)
  return redirect(userIsComplete ? "/" : "/login/first-login", {
    headers: {
      "Set-Cookie": cookie
    }
  })
}

export default function LoginStepNewPassword() {
  const { state } = useLocation()
  const { username } = useUser()
  const actionResult = useActionData<typeof action>()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const formRef = useRef(null)
  const settings = useSettings()

  useEffect(() => {
    if (actionResult?.errors?.password) {
      notifyError(actionResult.errors.password)
      return
    }
  }, [actionResult])

  return (
    <>
    <title>{`${lan.name} - Nouveau mot de passe`}</title>
    <div className="is-flex-col align-center justify-center is-relative">
      <div className="is-flex-col align-center gap-5 p-4 has-background-secondary-level " style={{ maxWidth: "50vw" }}>
        <div className="has-text-centered is-size-3">{state?.edit ? "Modifie" : "Crée"} ton mot de passe, <i style={{ color: "var(--accent-primary-color)" }}>{username}</i> ! </div>
        <Form ref={formRef} method="post" className="is-flex-col gap-4 is-full-width align-stretch">
          <div className="is-flex-col align-stretch gap-2">
            <div className="is-flex align-center justify-center gap-2">
              <div>Création du mot de passe :</div>
              {settings.security.securePassword &&
                <div title="Mot de passe de 8 à 18 caractères avec au minimum une majuscule, une minuscule, un chiffre et un caractère special (#?!@$%^&*-)">
                  <InfoSVG />
                </div>
              }
            </div>
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
                maxLength={18}
                title={"18 caractères max." + settings.security.securePassword ? " doit contenir au moins 1 de chaque : minuscule / majuscule / nombre / charcactère spécial" : ""}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); !!password && document.getElementById("confirmPassword")?.focus() } }}
              />
              <div className="pr-2" onMouseEnter={() => setShowPassword(true)} onMouseLeave={() => setShowPassword(false)}><EyeSVG /></div>
            </div>
          </div>
          <div className="is-flex-col align-stretch gap-2">
            <div className="has-text-centered">Confirmation du mot de passe :</div>
            <div className="is-flex align-center gap-2 has-background-primary-level">
              <input
                id="confirmPassword"
                name="confirmPassword"
                className={`input grow no-basis has-text-centered has-background-primary-level ${(password != confirmPassword) ? 'has-text-danger' : ''}`}
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Mot de passe"
                required
                maxLength={18}
                onKeyDown={(e) => { if (e.key === 'Enter') {  !!password ? formRef.current && (formRef.current as HTMLFormElement).submit() : e.preventDefault() } }}
              />
              <div className="pr-2" onMouseEnter={() => setShowConfirm(true)} onMouseLeave={() => setShowConfirm(false)}><EyeSVG /></div>
            </div>
          </div>
          <CustomButton
            active={!!password && password == confirmPassword}
            colorClass="has-background-secondary-accent"
            customClasses="is-align-self-flex-end"
            callback={() => formRef.current && (formRef.current as HTMLFormElement).submit()}
            contentItems={[state?.edit ? "Modifier" : "Se connecter"]}
          />
        </Form>
      </div>
    </div>
    </>
  )
}
