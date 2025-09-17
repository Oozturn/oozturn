import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from "@remix-run/node"
import { Form, useActionData, useLoaderData, useLocation } from "@remix-run/react"
import { getLan } from "~/lib/persistence/lan.server"
import { storePassword } from "~/lib/persistence/password.server"
import { getUserFromRequest, getUserId, updateSessionWithPasswordAuth } from "~/lib/session.server"
import { validate } from "./step-new-password.validate"
import { useEffect, useRef, useState } from "react"
import { CustomButton } from "~/lib/components/elements/custom-button"
import { useSettings } from "~/lib/components/contexts/SettingsContext"
import { notifyError } from "~/lib/components/notification"
import { EyeSVG, InfoSVG } from "~/lib/components/data/svg-container"
import { User } from "~/lib/types/user"
import { Trans, useTranslation } from "react-i18next"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.lanName + " - Nouveau mot de passe" }
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (process.env.AUTHENTICATION === 'false') {
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

  const errors = await validate(password, confirmPassword)
  if (errors) {
    return json({ ok: false, errors }, 400)
  }

  const userId = await getUserId(request) as string
  storePassword(userId, password)
  
  const user = await getUserFromRequest(request) as User
  const userIsComplete = (user.seat != '' || process.env.ASK_FOR_SEATS === "false") && (user.team != '')
  const cookie = await updateSessionWithPasswordAuth(request)
  return redirect(userIsComplete ? "/" : "/login/first-login", {
    headers: {
      "Set-Cookie": cookie
    }
  })
}

export default function LoginStepNewPassword() {
  const { state } = useLocation()
  const { username } = useLoaderData<typeof loader>()
  const actionResult = useActionData<typeof action>()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const formRef = useRef(null)
  const settings = useSettings()
  const { t } = useTranslation();
  
  useEffect(() => {
    if (actionResult?.errors?.password) {
      notifyError(actionResult.errors.password)
      return
    }
  }, [actionResult])

  return (
    <div className="is-flex-col align-center justify-center is-relative">
      <div className="is-flex-col align-center gap-5 p-4 has-background-secondary-level " style={{ maxWidth: "50vw" }}>
        <div className='has-text-centered is-size-3 cap-first'>
          {state?.edit ?
          <Trans i18nKey="login.titre_mdp_modification" values={{ user: username }} >
            crée ton mot de passe <i className="has-text-primary-accent">{username}</i> !
          </Trans>
          :
          <Trans i18nKey="login.titre_mdp_creation" values={{ user: username }} >
            modifie ton mot de passe <i className="has-text-primary-accent">{username}</i> !
          </Trans>
          }
        </div>
        <Form ref={formRef} method="post" className="is-flex-col gap-4 is-full-width align-stretch">
          <div className="is-flex-col align-stretch gap-2">
            <div className="is-flex align-center justify-center gap-2">
              <div className="cap-first">{t("login.mdp_creation")} :</div>
              {settings.security.securePassword &&
                <div title={t("login.mdp_hint")}>
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
                placeholder={t("login.mdp_placeholder")}
                required
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                maxLength={18}
                title={settings.security.securePassword ? t("login.mdp_regle_secure") : t("login.mdp_regle")}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); !!password && document.getElementById("confirmPassword")?.focus() } }}
              />
              <div className="pr-2" onMouseEnter={() => setShowPassword(true)} onMouseLeave={() => setShowPassword(false)}><EyeSVG /></div>
            </div>
          </div>
          <div className="is-flex-col align-stretch gap-2">
            <div className="has-text-centered cap-first">{t("login.confirm_mdp")}:</div>
            <div className="is-flex align-center gap-2 has-background-primary-level">
              <input
                id="confirmPassword"
                name="confirmPassword"
                className={`input grow no-basis has-text-centered has-background-primary-level ${(password != confirmPassword) ? 'has-text-danger' : ''}`}
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("login.mdp_placeholder")}
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
            contentItems={[state?.edit ? t("modifier") : t("login.se_connecter")]}
          />
        </Form>
      </div>
    </div>
  )
}
