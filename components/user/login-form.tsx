import { FormEvent, useState } from "react";
import { useSWRConfig } from 'swr';
import { LoginMutation, LoginMutationVariables } from "../../__generated__/gql/types";
import { LogoUnfolded } from "../../lib/data/svg-container";
import { client } from "../../lib/gql/client";
import { GET_ME_QUERY, LOGIN_MUTATION } from "../../lib/gql/operations/operations";
import { useLan } from "../../lib/hooks";


export default function LoginForm() {
  const { mutate } = useSWRConfig()
  const { data: lanResult, error: lanError } = useLan()
  const [animateLogo, setAnimateLogo] = useState(false)
  

  const lan = lanResult?.lan

  if (!lan) {
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const target = e.target as typeof e.target & {
      username: { value: string }
    }
    const username = target.username.value

    await client.request<LoginMutation, LoginMutationVariables>(LOGIN_MUTATION, { username: username })

    setAnimateLogo(true)
    await delay(3000)
    await mutate(GET_ME_QUERY)
  }

  return (
    <div className="is-flex is-flex-direction-column is-align-items-center">
      <div className="loginLogo" style={{width:"50vw"}}><LogoUnfolded animate={animateLogo} /></div>
      <div className="flat-box has-background-secondary-level is-full-width">
        <div className="has-text-centered mb-4 is-size-3">Bienvenue à la LAN <i style={{color:"var(--accent-primary-color)"}}>{lan.name}</i> ! </div>
        <form className="" onSubmit={handleSubmit}>
          <div className="field">
            <div className="control">
              <label className="has-text-centered" htmlFor="username">Pour te connecter, entre ton pseudo ici :</label>
              <input
                id="username"
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
        </form>
      </div>
    </div>
  );
}
