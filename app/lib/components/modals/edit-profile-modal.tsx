import { useFetcher, useNavigate } from "@remix-run/react"
import { ChangeEvent, useRef } from "react"
import useLocalStorageState from "use-local-storage-state"
import { autoSubmit } from "~/lib/utils/autosubmit"
import { useUser } from "../contexts/UserContext"
import { CloseCrossSVG } from "../data/svg-container"
import { accentsList, modesList } from "../data/themes"
import { CustomRadio } from "../elements/custom-radio"
import { UserAvatar } from "../elements/user-avatar"
import { useSettings } from "../contexts/SettingsContext"
import { clickorkey } from "~/lib/utils/clickorkey"
import { CustomButton } from "../elements/custom-button"
import { Intents } from "~/api/api"
import { notifyError } from "../notification"

interface EditProfileModalProps {
  show: boolean
  onHide: () => void
}

export default function EditProfileModal({ show, onHide }: EditProfileModalProps) {
  const [modeLocalStorage, setModeLocalStorage] = useLocalStorageState("mode", { defaultValue: "Dark" })
  const [accentLocalStorage, setAccentLocalStorage] = useLocalStorageState("accent", { defaultValue: "Switch" })
  const settings = useSettings()
  const user = useUser()
  const fetcherUpdateTeam = useFetcher()
  const fetcherUpdateSeat = useFetcher()
  const fetcherRemoveAvatar = useFetcher()
  const fetcherUpdateAvatar = useFetcher()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  if (!show || !user) {
    return null
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      if (e.target.files[0].size > 3 * 1024 * 1024) {
        notifyError("Avatar is too big (3MB max.)")
        return
      }
      fetcherUpdateAvatar.submit(e.currentTarget.form)
    }
  }

  async function handleChangePassword() {
    onHide()
    navigate("/login/step-new-password", { state: { edit: true } })
  }

  return (
    <div className="modal is-active">
      <div className="modal-background" {...clickorkey(onHide)}></div>
      <div className="modal-content">
        <div className="navbarUserCustomisationModal customModal is-flex align-stretch has-background-secondary-level pt-6 pl-6 pb-5">
          <div className="close is-clickable fade-on-mouse-out" {...clickorkey(onHide)}>
            <CloseCrossSVG />
          </div>
          <div className="has-background-primary-accent pl-1 mx-4"></div>
          <div>
            <div className="is-flex-col gap-2">
              <div className="is-title big">PROFIL</div>
              <div className="is-flex align-center gap-2">
                <div>Nom du joueur :</div>
                <div className="has-text-weight-semibold">{user.username}</div>
              </div>
              <div className="is-flex align-center gap-2">
                <div>Adresse IP :</div>
                <div className="has-text-weight-semibold">{user.ip || "127.0.0.1"}</div>
              </div>
              <fetcherUpdateTeam.Form method="POST" action="/api">
                <input type="hidden" name="intent" value={Intents.UPDATE_TEAM} />
                <div className="is-flex is-flex align-start gap-2" style={{ maxWidth: "402px" }}>
                  <div>Équipe :</div>
                  <div className="is-flex-col grow no-basis">
                    <input id="field"
                      name="team"
                      className="input" type="text"
                      defaultValue={user.team}
                      {...autoSubmit(fetcherUpdateTeam)}
                    />
                    <div className="is-size-7 mt-1">Utilisé pour calculer le score de ton équipe à cette LAN. Te foire pas sur l&apos;orthographe.</div>
                  </div>
                </div>
              </fetcherUpdateTeam.Form>
              <fetcherUpdateSeat.Form method="POST" action="/api">
                <input type="hidden" name="intent" value={Intents.UPDATE_SEAT} />
                <div className="is-flex is-flex align-start gap-2" style={{ maxWidth: "402px" }}>
                  <div>Place :</div>
                  <div className="is-flex-col grow no-basis">
                    <input id="field"
                      name="seat"
                      className="input" type="text"
                      defaultValue={user.seat}
                      {...autoSubmit(fetcherUpdateSeat)}
                    />
                    <div className="is-size-7 mt-1">Utilisé pour te retrouver facilement lors des duels. Devrait être de la forme &quot;A12&quot;. Demande à un admin si tu trouves pas où t&apos;es assis.</div>
                  </div>
                </div>
              </fetcherUpdateSeat.Form>
              {settings.security.authentication &&
                <CustomButton callback={handleChangePassword} colorClass="has-background-secondary-accent" contentItems={["Changer mdp"]} />
              }
            </div>
            <div className="m-5"></div>
            <div className="is-flex-col gap-2">
              <div className="is-title big">PERSONNALISATION</div>
              <div className="is-flex align-center gap-2">
                <div>Thème :</div>
                <CustomRadio setter={setModeLocalStorage} variable={modeLocalStorage} items={modesList.map(mode => { return { label: mode.name, value: mode.name } })} />
              </div>
              <div className="is-flex align-center gap-2">
                <div>Couleurs d&apos;accent :</div>
                {accentsList.map(accent =>
                  <div key={accent.name} title={accent.name} className={`is-clickable accentPicker mx-1 ${accentLocalStorage == accent.name ? 'is-active' : ''}`} {...clickorkey(() => setAccentLocalStorage(accent.name))} style={{ background: `linear-gradient(117.5deg, ${accent.primary} 50%, ${accent.secondary} 50%)` }}></div>
                )}
              </div>
              <div className="is-flex-col gap-2">
                <div>Avatar :</div>
                <div className="is-flex align-end gap-4">
                  <div className="is-clickable" {...clickorkey(() => { fileInputRef.current && fileInputRef.current.click() })}>
                    <UserAvatar username={user.username} avatar={user.avatar} size={196} />
                  </div>
                  <div className="is-flex-col buttons-list">
                    {user.avatar &&
                      <fetcherRemoveAvatar.Form method="POST" action="/api">
                        <input type="hidden" name="intent" value={Intents.REMOVE_AVATAR} />
                        <button type="submit"
                          className="customButton fade-on-mouse-out is-unselectable has-background-primary-accent is-clickable">
                          Supprimer l&apos;avatar
                        </button>
                      </fetcherRemoveAvatar.Form>
                    }
                    <fetcherUpdateAvatar.Form method="post" action="/api" encType="multipart/form-data">
                      <input name="intent" type="hidden" hidden value={Intents.UPLOAD_AVATAR} />
                      <input name="avatar" type="file" hidden ref={fileInputRef} id="selectAvatarInput" accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileChange} />
                      <button
                        onClick={event => { event.preventDefault(); fileInputRef.current?.click() }}
                        className="customButton fade-on-mouse-out is-unselectable has-background-secondary-accent is-clickable">
                        {user.avatar ? "Changer d'avatar" : "Nouvel avatar"}
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
