import { useFetcher, useNavigate } from "@remix-run/react"
import { ChangeEvent, useContext, useRef } from "react"
import useLocalStorageState from "use-local-storage-state"
import { autoSubmit } from "~/lib/utils/autosubmit"
import { UserContext } from "../contexts/UserContext"
import { CloseCrossSVG } from "../data/svg-container"
import { accentsList, modesList } from "../data/themes"
import { CustomRadio } from "../elements/custom-radio"
import { Intents } from "~/routes/api/route"
import { UserAvatar } from "../elements/user-avatar"
import { useLan } from "../contexts/LanContext"
import { clickorkey } from "~/lib/utils/clickorkey"

interface EditProfileModalProps {
  show: boolean
  onHide: () => void
}

export default function EditProfileModal({ show, onHide }: EditProfileModalProps) {
  const [modeLocalStorage, setModeLocalStorage] = useLocalStorageState("mode", { defaultValue: "Dark" })
  const [accentLocalStorage, setAccentLocalStorage] = useLocalStorageState("accent", { defaultValue: "Switch" })
  const me = useContext(UserContext)
  const fetcherUpdateTeam = useFetcher()
  const fetcherRemoveAvatar = useFetcher()
  const fetcherUpdateAvatar = useFetcher()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const lan = useLan()

  if (!show || !me) {
    return null
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      fetcherUpdateAvatar.submit(e.currentTarget.form)
    }
  }

  async function handleChangeMdp() {
    onHide()
    navigate("/login/step-new-password")
  }

  return (
    <div className="modal is-active">
      <div className="modal-background" {...clickorkey(onHide)}></div>
      <div className="modal-content">
        <div className="navbarUserCustomisationModal customModal is-flex is-align-items-stretch has-background-secondary-level pt-6 pl-6 pb-5">
          <div className="close is-clickable fade-on-mouse-out" {...clickorkey(onHide)}>
            <CloseCrossSVG />
          </div>
          <div className="has-background-primary-accent pl-1 mt-2 mx-4"></div>
          <div>
            <div className="playerProfile">
              <div className="is-title big">PROFIL</div>
              <div className="is-flex is-align-items-center mb-2">
                <div className="mr-2">Nom du joueur :</div>
                <div className="has-text-weight-semibold">{me.username}</div>
              </div>
              <div className="is-flex is-align-items-center mb-2">
                <div className="mr-2">Adresse IP :</div>
                <div className="has-text-weight-semibold">{me.ips.at(-1) || "127.0.0.1"}</div>
              </div>
              <fetcherUpdateTeam.Form method="POST" action="/api">
                <input type="hidden" name="intent" value={Intents.UPDATE_TEAM} />
                <div className="is-flex is-flex is-align-items-start" style={{ maxWidth: "402px" }}>
                  <div className="mr-2">Équipe :</div>
                  <div className="is-flex is-flex-direction-column is-flex-basis-0 is-flex-grow-1">
                    <input id="field"
                      name="team"
                      className="input" type="text"
                      defaultValue={me.team}
                      {...autoSubmit(fetcherUpdateTeam)}
                    />
                    <div className="is-size-7 mt-1">Utilisé pour calculer le score de ton équipe à cette LAN. Te foire pas sur l&apos;orthographe.</div>
                  </div>
                </div>
              </fetcherUpdateTeam.Form>
              {lan.authenticationNeeded &&
                <button
                  onClick={handleChangeMdp}
                  className="customButton fade-on-mouse-out is-unselectable has-background-primary-level is-clickable">
                  Changer mdp
                </button>
              }
            </div>
            <div className="m-5"></div>
            <div className="playerOptions">
              <div className="is-title big">PERSONNALISATION</div>
              <div className="is-flex is-align-items-center mb-2">
                <div className="mr-2">Thème :</div>
                <CustomRadio setter={setModeLocalStorage} variable={modeLocalStorage} items={modesList.map(mode => { return { label: mode.name, value: mode.name } })} />
              </div>
              <div className="is-flex is-align-items-center mb-2">
                <div className="mr-2">Couleurs d&apos;accent :</div>
                {accentsList.map(accent =>
                  <div key={accent.name} title={accent.name} className={`is-clickable accentPicker mx-1 ${accentLocalStorage == accent.name ? 'is-active' : ''}`} {...clickorkey(() => setAccentLocalStorage(accent.name))} style={{ background: `linear-gradient(117.5deg, ${accent.primary} 50%, ${accent.secondary} 50%)` }}></div>
                )}
              </div>
              <div className="is-flex is-flex-direction-column">
                <div className="mr-2">Avatar :</div>
                <div className="is-flex is-align-items-end">
                  <div className="avatar mt-2 mr-4">
                    <UserAvatar username={me.username} avatar={me.avatar} size={196} />
                  </div>
                  <div className="is-flex is-flex-direction-column buttons-list">
                    <fetcherRemoveAvatar.Form method="POST" action="/api">
                      <input type="hidden" name="intent" value={Intents.REMOVE_AVATAR} />
                      <button type="submit"
                        className="customButton fade-on-mouse-out is-unselectable has-background-primary-accent is-clickable">
                        Reset avatar
                      </button>
                    </fetcherRemoveAvatar.Form>
                    <fetcherUpdateAvatar.Form method="post" action="/api" encType="multipart/form-data">
                      <input name="intent" type="hidden" hidden value={Intents.UPLOAD_AVATAR} />
                      <input name="avatar" type="file" hidden ref={fileInputRef} id="selectAvatarInput" accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileChange} />
                      <button
                        onClick={event => { event.preventDefault(); fileInputRef.current?.click() }}
                        className="customButton fade-on-mouse-out is-unselectable has-background-secondary-accent is-clickable">
                        Nouvel avatar
                      </button>
                    </fetcherUpdateAvatar.Form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
