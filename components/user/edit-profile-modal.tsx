import { ChangeEvent, useState } from "react";
import { MeQuery, UpdateProfileMutation, UpdateProfileMutationVariables } from "../../__generated__/gql/types";
import { GET_ME_QUERY, UPDATE_PROFILE_MUTATION } from "../../lib/gql/operations/operations";
import { useMe } from "../../lib/hooks";

import useLocalStorageState from "use-local-storage-state";
import { CloseCrossSVG } from "../../lib/data/svg-container";
import { accentsList, modesList } from "../../lib/data/themes";
import { dealWithError } from "../../lib/error/error-management";
import { client } from "../../lib/gql/client";
import { CustomRadio } from "../elements/custom-radio";
import { SyncedInput } from "../elements/synced-input";
import { CustomButton } from "../elements/custom-button";

interface EditProfileModalProps {
  show: boolean;
  onHide: () => void;
}

export default function EditProfileModal({ show, onHide }: EditProfileModalProps) {
  const { data: meResult, mutate: mutateMe } = useMe()
  const [file, setFile] = useState<File>();
  const [modeLocalStorage, setModeLocalStorage] = useLocalStorageState("mode", { defaultValue: "Dark" })
  const [accentLocalStorage, setAccentLocalStorage] = useLocalStorageState("accent", { defaultValue: "Switch" })

  const me = meResult?.me
  if (!show || !me) {
    return null
  }

  async function removeAvatar() {
    await client.request<UpdateProfileMutation, UpdateProfileMutationVariables>(UPDATE_PROFILE_MUTATION, { removeAvatar: true })
    await mutateMe()
  }
  
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    function validateFile(file: File): string {
      if (file.size > 3 * 1024 * 1024) {
        return "La taille est limité à 3Mo"
      }
      return "";
    }
    if (e.target.files) {
      const file = e.target.files[0]
      const error = validateFile(file)
      if (error) {
        dealWithError(error)
        return;
      }
      await client.request<UpdateProfileMutation, UpdateProfileMutationVariables>(UPDATE_PROFILE_MUTATION, { avatarFile: file })
      await mutateMe()
      setFile(file);
    }
  };

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onHide}></div>
      <div className="modal-content">
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
                <div className="has-text-weight-semibold">{me.ip || "127.0.0.1"}</div>
              </div>
              <div className="is-flex is-flex is-align-items-start" style={{maxWidth:"402px"}}>
                <div className="mr-2">Équipe :</div>
                <div className="is-flex is-flex-direction-column is-flex-basis-0 is-flex-grow-1">
                  <SyncedInput type='input' query={GET_ME_QUERY} valueSelector={(query: MeQuery) => (query.me?.team || "")} mutationQuery={UPDATE_PROFILE_MUTATION} mutationVariableName="team" baseMutationVariable={{ username: me.username }} />
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
                      <img className="is-rounded" src={`/api/static/avatar/${me.avatar}`} alt="Avatar not found" />
                    }
                  </div>
                  <div className="is-flex is-flex-direction-column buttons-list">
                    <CustomButton callback={removeAvatar} contentItems={["Reset avatar"]} colorClass="has-background-primary-accent" />
                    <input hidden type="file" id="selectAvatarInput" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} />
                    <CustomButton callback={() => document?.getElementById("selectAvatarInput")?.click()} contentItems={["Nouvel avatar"]} colorClass="has-background-secondary-accent"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
