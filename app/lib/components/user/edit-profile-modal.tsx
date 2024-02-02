import { ChangeEvent, useContext, useState } from "react";
import useLocalStorageState from "use-local-storage-state";
import { CloseCrossSVG } from "../data/svg-container";
import { accentsList, modesList } from "../data/themes";
import { CustomButton } from "../elements/custom-button";
import { autoSubmit } from "~/lib/utils/autosubmit";
import { UserContext } from "../contexts/UserContext";
import { useFetcher } from "@remix-run/react";
import { CustomRadio } from "../elements/custom-radio";

interface EditProfileModalProps {
  show: boolean;
  onHide: () => void;
}

export default function EditProfileModal({ show, onHide }: EditProfileModalProps) {
  const [file, setFile] = useState<File>();
  const [modeLocalStorage, setModeLocalStorage] = useLocalStorageState("mode", { defaultValue: "Dark" })
  const [accentLocalStorage, setAccentLocalStorage] = useLocalStorageState("accent", { defaultValue: "Switch" })
  const me = useContext(UserContext);
  const fetcher = useFetcher();

  if (!show || !me) {
    return null
  }

  async function removeAvatar() { }
  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) { }

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onHide}></div>
      <div className="modal-content">
        <fetcher.Form method="POST">
          <div className="flat-box navbarPlayerCustomisationModal customModal is-flex is-align-items-stretch has-background-secondary-level pt-6 pl-6 pb-5">
            <div className="close is-clickable fade-on-mouse-out" onClick={onHide}>
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
                <div className="is-flex is-flex is-align-items-start" style={{ maxWidth: "402px" }}>
                  <div className="mr-2">Équipe :</div>
                  <div className="is-flex is-flex-direction-column is-flex-basis-0 is-flex-grow-1">
                    <input id="field"
                      name="team"
                      className="input" type="text"
                      defaultValue={me.team}
                      {...autoSubmit(fetcher)}
                    />
                    <div className="is-size-7 mt-1">Utilisé pour calculer le score de ton équipe à cette LAN. Te foire pas sur l&apos;orthographe.</div>
                  </div>
                </div>
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
                    <div key={accent.name} title={accent.name} className={`is-clickable accentPicker mx-1 ${accentLocalStorage == accent.name ? 'is-active' : ''}`} onClick={() => setAccentLocalStorage(accent.name)} style={{ background: `linear-gradient(117.5deg, ${accent.primary} 50%, ${accent.secondary} 50%)` }}></div>
                  )}
                </div>
                <div className="is-flex is-flex-direction-column">
                  <div className="mr-2">Avatar :</div>
                  <div className="is-flex is-align-items-end">
                    <div className="avatar mt-2 mr-4">
                      {me.avatar &&
                        <img className="is-rounded" src={`/avatar/${me.avatar}`} alt="Avatar not found" />
                      }
                    </div>
                    <div className="is-flex is-flex-direction-column buttons-list">
                      <CustomButton callback={removeAvatar} contentItems={["Reset avatar"]} colorClass="has-background-primary-accent" />
                      <input hidden type="file" id="selectAvatarInput" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} />
                      <CustomButton callback={() => document?.getElementById("selectAvatarInput")?.click()} contentItems={["Nouvel avatar"]} colorClass="has-background-secondary-accent" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
