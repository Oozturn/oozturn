import { ActionFunctionArgs, MetaFunction } from "@remix-run/node"
import { Form, useActionData, useSubmit, useLoaderData } from "@remix-run/react"
import { LogoUnfolded } from "~/lib/components/data/svg-container"
import { doLogin } from "./login.queries.server"
import { useLan } from "~/lib/components/contexts/LanContext"
import { getLan } from "~/lib/persistence/lan.server"
import { useEffect, useRef, useState } from "react"
import { CustomButton } from "~/lib/components/elements/custom-button"
import { clickorkey } from "~/lib/utils/clickorkey"
import { getUsers } from "~/lib/persistence/users.server"
import { notifyError } from "~/lib/components/notification"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: data?.lanName + " - Connexion" }]
}

export async function loader(): Promise<{
  lanName: string
  usernames: string[]
}> {
  const usernames = process.env.UNSAFE_ALLOW_EASY_LOGIN === "true" ? getUsers().map((u) => u.username) : []
  return { lanName: getLan().name, usernames: usernames }
}

export async function action({ request }: ActionFunctionArgs) {
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
  const submit = useSubmit()

  useEffect(() => {
    if (actionResult?.error) {
      notifyError(actionResult.error)
      setAnimateLogo(false)
    }
  }, [actionResult])

  async function handleSubmit() {
    if (!formRef.current) return
    setAnimateLogo(true)
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))
    const form = formRef.current as HTMLFormElement
    await delay(2000)
    submit(form)
  }

  return (
    <div className="is-flex-col align-center justify-center">
      <div className="loginLogo" style={{ width: "50vw" }}>
        <LogoUnfolded animate={animateLogo} />
      </div>
      <div className="is-flex-col align-center gap-5 p-4 has-background-secondary-level " style={{ maxWidth: "50vw" }}>
        <div className="has-text-centered is-size-3">
          Bienvenue à la LAN <i style={{ color: "var(--accent-primary-color)" }}>{lan.name}</i> !{" "}
        </div>
        <Form ref={formRef} method="post" className="is-flex-col gap-6 is-full-width align-stretch">
          <div className="is-flex-col align-center gap-2 is-relative">
            <div>Pour te connecter, entre ton pseudo ici :</div>
            <input
              id="username"
              name="username"
              className="input grow no-basis has-text-centered has-background-primary-level"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Pseudo"
              required
              readOnly={animateLogo}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              maxLength={15}
              title="15 caractères max. N'ajoute pas ton tag d'équipe, ce sera fait plus tard"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  !!username && handleSubmit()
                }
              }}
              autoComplete="off"
            />
            <LoginUsersDropDown
              show={username.length > 0}
              usernameToMatch={username}
              callbackOnUserSelect={(newUsername) => {
                setUsername(newUsername)
                handleSubmit()
              }}
            />
          </div>
          <CustomButton
            active={!animateLogo && !!username}
            colorClass="has-background-secondary-accent"
            customClasses="is-align-self-flex-end"
            callback={handleSubmit}
            contentItems={["Se connecter"]}
          />
        </Form>
      </div>
    </div>
  )
}

function LoginUsersDropDown({
  usernameToMatch,
  callbackOnUserSelect,
  show
}: {
  usernameToMatch: string
  callbackOnUserSelect: (username: string) => void
  show: boolean
}) {
  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase()

  const { usernames: allUsernames } = useLoaderData<typeof loader>()
  const [usernames, setUsernames] = useState<string[]>([])

  useEffect(() => {
    const regexp = new RegExp(
      ".*" +
        normalize(usernameToMatch)
          .split("")
          .map((c) => c + ".*")
          .join("") +
        ".*"
    )
    setUsernames(allUsernames.filter((username) => regexp.test(normalize(username))))
  }, [usernameToMatch, allUsernames])

  if (!show) return null
  if (!usernames.length) return null
  if (usernames.length == 1 && usernames[0] == usernameToMatch) return null

  return (
    <div
      className="has-background-primary-level is-half-width is-scrollable has-text-centered"
      style={{
        border: "2px solid var(--background-secondary-level)",
        position: "absolute",
        top: "110%",
        maxHeight: "15rem",
        width: "50%"
      }}
    >
      {usernames.map((username) => (
        <div key={username} className="is-clickable" {...clickorkey(() => callbackOnUserSelect(username))}>
          {username}
        </div>
      ))}
    </div>
  )
}
