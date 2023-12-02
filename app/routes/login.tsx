import { ActionFunctionArgs } from "@remix-run/node"
import { Form } from "@remix-run/react"
import { LogoUnfolded } from "~/lib/components/data/svg-container"
import { doLogin } from "~/lib/process/login-process.server"



export async function action({ request, }: ActionFunctionArgs) {
  const body = await request.formData()
  return doLogin(String(body.get("username")))
}

export default function Login() {
  return <main className="main is-clipped is-relative is-flex is-flex-direction-column is-justify-content-center is-align-items-center">
    <LoginForm />
  </main>
}

function LoginForm() {
  const lan = {
    name: "Lan Name"
  }
  const animateLogo = false
  if (!lan) {
    return null
  }

  return (
    <div className="is-flex is-flex-direction-column is-align-items-center">
      <div className="loginLogo" style={{ width: "50vw" }}><LogoUnfolded animate={animateLogo} /></div>
      <div className="flat-box has-background-secondary-level is-full-width">
        <div className="has-text-centered mb-4 is-size-3">Bienvenue à la LAN <i style={{ color: "var(--accent-primary-color)" }}>{lan.name}</i> ! </div>
        <Form method="post">
          <div className="field">
            <div className="control">
              <label className="has-text-centered" htmlFor="username">Pour te connecter, entre ton pseudo ici :</label>
              <input
                id="username"
                name="username"
                className="mt-2 input is-radiusless"
                type="text"
                placeholder="Pseudo"
                required
                autoFocus
                maxLength={15}
                title="15 caractères max. N'ajoute pas ton tag d'équipe, ce sera fait plus tard"
              />
            </div>
          </div>
          <div className="field mt-4">
            <div className="control">
              <button type='submit' disabled={animateLogo} className={`is-link my-0 is-radiusless is-borderless has-background-secondary-accent py-2 px-4 is-pulled-right ${animateLogo ? "fade-text" : ""}`}>Se connecter</button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}