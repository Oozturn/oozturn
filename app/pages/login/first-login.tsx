import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Form, redirect, useLoaderData, useNavigate } from "@remix-run/react"
import { getLan } from "~/lib/persistence/lan.server"
import { useRef, useState } from "react"
import { CustomButton } from "~/lib/components/elements/custom-button"
import { requireUserLoggedIn } from "~/lib/session.server"
import { getUserById, updateUser } from "~/lib/persistence/users.server"
import { User } from "~/lib/types/user"
import { useTranslation } from "react-i18next"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.lanName + " - Première connexion" }
  ]
}

export async function loader({ request }: LoaderFunctionArgs): Promise<{
  lanName: string,
  user: User
}> {
  const user = await getUserById(await requireUserLoggedIn(request))
  if (!user) throw redirect('/login')
  // if (user.team && user.seat) throw redirect('/')
  return { lanName: getLan().name, user: user }
}

export async function action({ request, }: ActionFunctionArgs) {
  const body = await request.formData()
  updateUser(String(body.get('userId')), { team: String(body.get('team')), seat: String(body.get('seat')) })
  return redirect('/')
}

export default function LoginStepUsername() {
  return <FirstLoginForm />
}

function FirstLoginForm() {
  const user = useLoaderData<typeof loader>().user
  const [team, setTeam] = useState(user.team)
  const [seat, setSeat] = useState(user.seat)
  const formRef = useRef(null)
  const navigate = useNavigate()
  const { t } = useTranslation();
  async function handleSubmit() {
    if (!formRef.current) return
    const form = formRef.current as HTMLFormElement
    form.submit()
  }

  return (
    <div className="is-flex-col align-center justify-center">
      <div className="is-flex-col align-center gap-5 p-4 has-background-secondary-level " style={{ maxWidth: "50vw" }}>
        <div className="has-text-centered is-size-3">{t("first_login.bienvenue")}, <i style={{ color: "var(--accent-primary-color)" }}>{user.username}</i> ! </div>
        <div>
          <div className="cap-first">{t("first_login.equipe_et_place")} :</div>
          <Form ref={formRef} method="post" className="is-flex-col gap-6 is-full-width align-stretch">
            <input type="hidden" name="userId" value={user.id} />
            <div>
              <div className="is-flex is-flex align-start gap-2" style={{ maxWidth: "402px" }}>
                <div>{t("equipe")} :</div>
                <div className="is-flex-col grow no-basis">
                  <input id="team"
                    name="team"
                    className="input grow no-basis has-text-centered has-background-primary-level"
                    type="text"
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder={t("equipe")}
                    required
                    title={t("first_login.equipe_hint")}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById("seat")?.focus() } }}
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="is-flex is-flex align-start gap-2" style={{ maxWidth: "402px" }}>
                <div>{t("Place")} :</div>
                <div className="is-flex-col grow no-basis">
                  <input id="seat"
                    name="seat"
                    className="input grow no-basis has-text-centered has-background-primary-level"
                    type="text"
                    value={seat}
                    onChange={(e) => setSeat(e.target.value)}
                    placeholder="Place"
                    required
                    title={t("first_login.place_hint")}
                    onKeyDown={(e) => { if (e.key === 'Enter') { formRef.current && (formRef.current as HTMLFormElement).submit() } }}
                  />
                </div>
              </div>
            </div>
            {(!!team && !!seat) ?
              <CustomButton
                colorClass="has-background-secondary-accent"
                customClasses="is-align-self-flex-end"
                callback={handleSubmit}
                contentItems={[t("enregistrer")]}
              />
              :
              <CustomButton
                colorClass="has-background-primary-level"
                customClasses="is-align-self-flex-end"
                callback={() => navigate("/")}
                contentItems={[t("passer")]}
              />
            }
          </Form>
        </div>
      </div >
    </div >
  )
}