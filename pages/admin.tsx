import Head from 'next/head'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import { mutate, useSWRConfig } from "swr"
import { AdminElevationMutation, AdminElevationMutationVariables, LanQuery, UpdateLanMutation, UpdateLanMutationVariables } from '../__generated__/gql/types'
import { CustomButton } from '../components/elements/custom-button'
import { CustomRadio } from '../components/elements/custom-radio'
import { CustomSelect } from '../components/elements/custom-select'
import { SyncedInput } from '../components/elements/synced-input'
import { client } from '../lib/gql/client'
import { ADMIN_ELEVATION_MUTATION, GET_LAN_QUERY, GET_ME_QUERY, UPDATE_LAN_MUTATION } from '../lib/gql/operations/operations'
import { useLan, useLeaderboard, useMe, usePlayers, useTournaments } from '../lib/hooks'
import { Days, range } from '../lib/utils'
import { UserAvatar } from '../components/elements/user-avatar'

export default function AdminPage() {
  const { data: meResult, error: meError } = useMe()
  const { data: lanResult, error: lanError } = useLan()
  const user = meResult?.me

  return (
    <>
      <Head>
        <title>{lanResult?.lan.name || ""} - Admin</title>
      </Head>

      {user?.isAdmin ?
        <AdminContent />
        :
        <AdminElevationForm />
      }

    </>
  )
}

export function AdminElevationForm() {
  const { mutate } = useSWRConfig()


  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const target = e.target as typeof e.target & {
      password: { value: string }
    }

    await client.request<AdminElevationMutation, AdminElevationMutationVariables>(ADMIN_ELEVATION_MUTATION, { password: target.password.value })
    await mutate(GET_ME_QUERY)
  }

  return (
    <div className="is-full-height is-flex is-flex-direction-column is-align-items-center is-justify-content-space-around is-align-items-center">
      <form className="flat-box field has-background-secondary-level is-child is-4 is-flex is-flex-direction-column is-align-items-center" onSubmit={handleSubmit}>
        <div className="has-text-centered">Mot de passe administrateur</div>
        <input id='password' autoFocus className="input my-4 is-radiusless" type="password" placeholder="Mot de passe" required />
        <button type='submit' className="is-link my-0 is-radiusless is-borderless has-background-secondary-accent py-2 px-4 is-pulled-right">Soumettre</button>
      </form>
      <div></div>
    </div>
  )
}

export function AdminContent() {
  const { data: playersResult, error: playersError } = usePlayers()
  const { data: lanResult, error: lanError } = useLan()
  const [activePlayer, setActivePlayer] = useState("")
  const { data: leaderboardResult, error: leaderboardError } = useLeaderboard()
  const { data: tournamentsResult, error: tournamentsError } = useTournaments()
  const router = useRouter()
  
  const lan = lanResult?.lan

  if (!lan) {
    return null
  }

  const leaderboard = leaderboardResult?.leaderboard
  const tournaments = tournamentsResult?.tournaments

  async function setStartDateDay(value: number) {
    if (!lan)
      return

    lan.startDate.day = value

    applyLanMutation({startDate: lan.startDate})
  }
  async function setStartDateHour(value: number) {
    if (!lan)
      return

    lan.startDate.hour = value

    applyLanMutation({startDate: lan.startDate})
  }
  async function setEndDateDay(value: number) {
    if (!lan)
      return

    lan.endDate.day = value

    applyLanMutation({endDate: lan.endDate})
  }
  async function setEndDateHour(value: number) {
    if (!lan)
      return

    lan.endDate.hour = value

    applyLanMutation({endDate: lan.endDate})
  }

  async function updateTopRanks(value: string, index: number) {
    if (!lan || !lan.defaultTournamentSettings || lan.defaultTournamentSettings.leaders.length - 1 < index || Number.isNaN(Number(value)))
      return

    lan.defaultTournamentSettings.leaders[index] = Number(value)

    applyLanMutation({defaultTournamentSettings: lan.defaultTournamentSettings})
  }

  async function updateDefault(value: string) {
    if (!lan || !lan.defaultTournamentSettings || Number.isNaN(Number(value)))
      return

    lan.defaultTournamentSettings.default = Number(value)

    applyLanMutation({defaultTournamentSettings: lan.defaultTournamentSettings})
  }

  async function updateWeightTeamsResults(value: boolean) {
    if (!lan || lan.weightTeamsResults == undefined)
      return
  
    lan.weightTeamsResults = value

    applyLanMutation({weightTeamsResults: lan.weightTeamsResults})
  }

  async function updatepartialResults(value: boolean) {
    if (!lan || lan.partialResults == undefined)
      return
  
    lan.partialResults = value

    applyLanMutation({partialResults: lan.partialResults})
  }

  async function applyLanMutation(updateObject: any) {
    if (!lan)  {
      return
    }

    await client.request<UpdateLanMutation, UpdateLanMutationVariables>(UPDATE_LAN_MUTATION, updateObject)
    await mutate(GET_LAN_QUERY)
  }

  const players = playersResult?.players

  return (
    <>
    <div className="is-full-height is-flex is-flex-direction-row p-3">
      <div className="adminLanSettings is-flex is-flex-direction-column p-0 mr-3">
        <div className="lanSettings flat-box has-background-secondary-level mb-3 mt-0 pt-2">
          <div className='is-title medium is-uppercase'>Réglages de la LAN</div>
          <div className='is-flex'>
            <div className='lanSettingsOpts is-flex is-flex-direction-column mr-4'>
              <div className='lanName has-text-right'>Nom de la LAN :</div>
              <div className='lanDate has-text-right'>Début de la LAN :</div>
              <div className='lanDate has-text-right'>Fin de la LAN :</div>
              <div className='lanMotd has-text-right'>Mot du jour :</div>
            </div>
            <div className='lanSettingsOpts is-flex is-flex-direction-column is-flex-grow-1'>
              <SyncedInput controlClasses='lanName' type='input' query={GET_LAN_QUERY} valueSelector={(query: LanQuery) => query.lan.name} mutationQuery={UPDATE_LAN_MUTATION} mutationVariableName="name" />
              <div className='lanDate is-flex'>
                <CustomSelect
                  variable={lan.startDate.day}
                  setter={(v: string) => setStartDateDay(Number(v))}
                  items={range(0, 6, 1).map(d =>{return {label: Days[d], value: d}})}
                  customClass='mr-3'
                  itemsToShow={7}
                />
                <CustomSelect
                  variable={lan.startDate.hour}
                  setter={(v: string) => setStartDateHour(Number(v))}
                  items={range(0, 23, 1).map(d =>{return {label: String(d) + "h ", value: d}})}
                  itemsToShow={15}
                />
              </div>
              <div className='lanDate is-flex'>
                <CustomSelect
                  variable={lan.endDate.day}
                  setter={(v: string) => setEndDateDay(Number(v))}
                  items={[...range(lan.startDate.day + 1, 6, 1), ...range(0, lan.startDate.day - 1, 1)].map(d =>{return {label: Days[d], value: d}})}
                  customClass='mr-3'
                />
                <CustomSelect
                  variable={lan.endDate.hour}
                  setter={(v: string) => setEndDateHour(Number(v))}
                  items={range(0, 23, 1).map(d =>{return {label: String(d) + "h ", value: d}})}
                  customClass='mr-3'
                  itemsToShow={15}
                />
              </div>
              <SyncedInput controlClasses='lanMotd' type='textarea' query={GET_LAN_QUERY} valueSelector={(query: LanQuery) => query.lan.motd} mutationQuery={UPDATE_LAN_MUTATION} mutationVariableName="motd" />
            </div>
          </div>
        </div>

        <div className="flat-box has-background-secondary-level is-scrollable is-flex-grow-1">
          <div className='is-title medium is-uppercase'>Réglages du tournoi</div>
          <div className="globalTournamentOptions mt-5">
            <div className="is-flex is-align-items-center">
              <div className="mr-2">Jeux du tournoi :</div>
              <CustomButton
                customClasses='ml-3'
                colorClass='has-background-primary-level'
                contentItems={["Gérer les jeux"]}
                callback={() => router.push(("/managegames"))}
                tooltip='Ajouter des jeux à la LAN via IGDB. Ou les supprimer.'
              />
            </div>
          </div>
          <div className="globalTournamentOptions mt-5">
            <div className="is-flex mb-2">
              <div className="mr-2">Classement global :</div>
              <div className='ml-3 is-size-7 is-flex-basis-0 is-flex-grow-1'>
                Tous les tournois seront pris en compte pour ce classement global.
                Cependant tu peux donner plus ou moins d’importance à un tournoi en changeant son coefficient d’importance dans ses paramètres.
              </div>
            </div>
            <div className="">
              <div className="ml-6">
                <div className='mb-3'>Points gagnés par tournoi par défaut :</div>
                <div className='is-flex is-flex-wrap-wrap topRanksPoints pl-6'>
                  <div className='rankPoints is-flex is-flex-direction-column mr-4'>
                    <div className='rank has-text-right has-text-weight-normal'>Place :</div>
                    <div className='points has-text-right'>Points :</div>
                  </div>
                  {lan.defaultTournamentSettings.leaders.map( (points, index) => 
                    <div key={index} className="rankPoints is-flex is-flex-direction-column">
                      <div className="rank is-flex is-justify-content-center is-align-items-center">{index + 1}</div>
                      <input className="points" type="text" placeholder={String(points)} value={String(points)} onChange={(e) => updateTopRanks(e.target.value, index)}></input>
                    </div>
                  )}
                  <div className="rankPoints is-flex is-flex-direction-column">
                    <div className="rank is-flex is-justify-content-center is-align-items-center">5 et +</div>
                    <input className="points" type="text" placeholder={String(lan.defaultTournamentSettings?.default)} value={String(lan.defaultTournamentSettings?.default)} onChange={(e) => updateDefault(e.target.value)}></input>
                  </div>
                </div>
                <div className='is-size-7 mt-2 pl-6'>Dans ce tableau, indique le nombre de points que les joueurs recevront à chaque tournoi en fonction de leur classement.</div>
              </div>
            </div>
          </div>
          <div className="globalTournamentOptions mt-5 ml-6">
            <div className='is-flex is-align-items-start'>
              <div className='mr-1'>Classement d&apos;équipe pondéré :</div>
              <div className='is-flex is-flex-direction-column'>
                <CustomRadio variable={lan.weightTeamsResults} setter={updateWeightTeamsResults} items={[{label:'non', value:false}, {label:'oui', value:true}]}/>
                <div className='mx-3 is-size-7'>Sélectionne <i>oui</i> pour pondérer les scores d&apos;équipe en fonction du nombre de joueurs qui la composent. Dans le cas contraire, bien sûr, sélectionne <i>non</i>.</div>
              </div>
            </div>
          </div>
          <div className="globalTournamentOptions mt-5 ml-6">
            <div className='is-flex is-align-items-start'>
              <div className='mr-1'>Résultats provisoires :</div>
              <div className='is-flex is-flex-direction-column'>
                <CustomRadio variable={lan.partialResults} setter={updatepartialResults} items={[{label:'non', value:false}, {label:'oui', value:true}]}/>
                <div className='mx-3 is-size-7'>En choisissant <i>oui</i>, les résultats des tournois seront calculés et mis à jour à chaque match. Chaque participant aura le minimum de points possible en fonction de ses matchs terminés.</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="flat-box has-background-secondary-level adminPlayersList is-full-height is-flex is-flex-direction-column pr-2">
        <div className="is-title medium mb-2">Joueurs</div>
        <div className="playerTilesContainer is-flex is-flex-direction-column p-0 m-0 is-scrollable pr-2">
          {players && players.sort((a,b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase())).map(player =>
              player? 
              <div key={player.username} className={`playerTile is-flex is-flex-direction-column ${activePlayer == player.username ? 'is-active' : ''}`}>
                <div className='is-flex is-align-items-center is-unselectable is-clickable' onClick={() => setActivePlayer(activePlayer == player.username ? '' : player.username)}>
                  <div className='avatar mr-3'>
                    <UserAvatar username={player.username} avatar={player.avatar} />
                  </div>
                  {player.team && <div className='team fade-text mr-3'>[{player.team}]</div>}
                  <div className='username'>{player.username}</div>
                </div>
                <div className='playerTooltip is-flex pl-3'>
                  <div className='is-flex is-flex-direction-column'>
                    <div>IP: {player.ips? player.ips[0] : 'unknown'}</div>
                    <div>Tournois: {tournaments?.filter(tournament => tournament.players.includes(player.username)).length || 0}</div>
                    <div>Points: {leaderboard?.find(pscore => pscore.player.username == player.username)?.points || 0}</div>
                  </div>
                </div>
              </div> : <></>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
