import { ActionFunctionArgs, MetaFunction } from "@remix-run/node"
import { Form, useActionData } from "@remix-run/react"
import { LogoUnfolded } from "~/lib/components/data/svg-container"
import { doLogin } from "./login.queries.server"
import { useLan } from "~/lib/components/contexts/LanContext"
import { getLan } from "~/lib/persistence/lan.server"
import { useRef, useState } from "react"
import { CustomButton } from "~/lib/components/elements/custom-button"
import { Trans, useTranslation } from "react-i18next"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.lanName + " - Connexion" }
  ]
}

export async function loader(): Promise<{
  lanName: string
}> {
  return { lanName: getLan().name }
}

export async function action({ request, }: ActionFunctionArgs) {
  const body = await request.formData()
  return await doLogin(String(body.get("username")))
}

export default function LoginStepUsername() {
  return <LoginForm />
}

function LoginForm() {
  const lan = useLan()
  const actionResult = useActionData<typeof action>()
  const [animateLogo, setAnimateLogo] = useState(false)
  const [username, setUsername] = useState("")
  const formRef = useRef(null)
  const { t } = useTranslation();

  async function handleSubmit() {
    if (!formRef.current) return
    setAnimateLogo(true)
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    const form = formRef.current as HTMLFormElement
    await delay(2000)
    form.submit()

  }

  return (
    <div className="is-flex-col align-center justify-center">
      <div className="loginLogo" style={{ width: "50vw" }}>
        <LogoUnfolded animate={animateLogo} />
      </div>
      <div className="is-flex-col align-center gap-5 p-4 has-background-secondary-level " style={{ maxWidth: "50vw" }}>
        <div className='has-text-centered is-size-3 cap-first'>
          <Trans i18nKey="login.bienvenue_a_la_lan" values={{ lanName: lan.name }}>
            Bienvenue à la LAN <i className="has-text-primary-accent">{lan.name}</i> !
          </Trans>
        </div>
        <Form ref={formRef} method="post" className="is-flex-col gap-6 is-full-width align-stretch">
          <div className="is-flex-col align-center gap-2">
            <div className="cap-first">{t("login.entrer_pseudo")} :</div>
            <input
              id="username"
              name="username"
              className="input grow no-basis has-text-centered has-background-primary-level"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("login.pseudo_placeholder")}
              required
              readOnly={animateLogo}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              maxLength={15}
              title={t("login.pseudo_hint")}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); !!username && handleSubmit() } }}
            />
          </div>
          <CustomButton
            active={!animateLogo && !!username}
            colorClass="has-background-secondary-accent"
            customClasses="is-align-self-flex-end"
            callback={handleSubmit}
            contentItems={[t("login.se_connecter")]}
          />
        </Form>
      </div>
      {actionResult?.error && (
        <p className="has-text-danger" style={{ position: "absolute", bottom: "-2rem", width: "500%", textAlign: "center" }}>
          {actionResult.error}
        </p>
      )}
    </div>
  )
}