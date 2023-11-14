import Head from 'next/head'
import { useGames, useLan, useMe, useTournament } from "../../lib/hooks";
import TournamentsList from '../../components/tournament/tournaments-list';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { client } from '../../lib/gql/client';
import { EditTournamentInput, EditTournamentMutation, EditTournamentMutationVariables, TournamentStatus } from '../../__generated__/gql/types';
import { EDIT_TOURNAMENT_MUTATION, GET_TOURNAMENTS_QUERY } from '../../lib/gql/operations/operations';
import { useSWRConfig } from 'swr';
import { Duel } from '../../lib/tournament/duel';
import { DuelSVG, DuelSoloSVG, DuelTeamSVG, FFASVG, FFASoloSVG, FFATeamSVG } from '../../lib/data/svg-container';
import { CustomRadio } from '../../components/elements/custom-radio';
import { CustomSelect } from '../../components/elements/custom-select';
import { Days, GetFFAMaxPlayers, range, removeNulls } from '../../lib/utils';
import { CustomButton } from '../../components/elements/custom-button';

export default function NewTournamentsPage() {
  
  const [ tournamentId, setTournamentId ] = useState('')
  const { data: meResult, error: meError } = useMe()
  const { data: tournamentResult, error: tournamentError } = useTournament(tournamentId)
  const { data: gamesResult, error: gamesError } = useGames()
  const { data: lanResult, error: lanError } = useLan()
  const router = useRouter()
  
  const lan = lanResult?.lan
  const user = meResult?.me
  if (!user || !lan) {
    return null
  }
  const gamesList = gamesResult?.games

  var {t_id} = router.query
  if (!t_id || Array.isArray(t_id) || !gamesList) {
    return null
  }
  tournamentId == '' && setTournamentId(t_id)

  const tournament = tournamentResult?.tournament
  
  if (tournament && ![TournamentStatus.Open, TournamentStatus.Balancing].includes(tournament.status))
    router.push("/tournaments/" + t_id)

  return (
    <>
      <Head>
        <title>{lan.name || ""} - {t_id == "new" ? "Nouveau tournoi" : "Edition de " + tournament?.name}</title>
      </Head>

      <div className="is-full-height is-flex p-3">
        <TournamentsList selected={t_id}/>
        {t_id == "new" || !tournament ?
          <EditTournamentForm
            id={t_id}
            name=''
            game={gamesList[0].id}
            bracketProperties={{type:"", options:{}}}
            status={TournamentStatus.Open}
            useTeams={undefined}
            usersCanCreateTeams={false}
            teamsMaxSize={8}
            startTime={lan.startDate}
            globalTournamentSettings={lan.defaultTournamentSettings}
            comments=''/>
          :
          <EditTournamentForm
            id={tournament.id}
            name={tournament.name}
            game={tournament.game}
            bracketProperties={removeNulls(tournament.bracketProperties) || {type:"", options:{}}}
            status={tournament.status}
            useTeams={tournament.useTeams}
            usersCanCreateTeams={tournament.usersCanCreateTeams || false}
            teamsMaxSize={tournament.teamsMaxSize || undefined}
            startTime={tournament.startTime || lan.startDate}
            globalTournamentSettings={tournament.globalTournamentSettings || lan.defaultTournamentSettings}
            comments={tournament.comments}/>
        }
      </div>
    </>
  )
}

export function EditTournamentForm({ id, name, game, bracketProperties, useTeams, usersCanCreateTeams, teamsMaxSize, status, startTime, globalTournamentSettings, comments }: EditTournamentInput) {
  const router = useRouter()
  const { data: gamesResult, error: gamesError } = useGames()
  const { mutate } = useSWRConfig()
  const { data: lanResult, error: lanError } = useLan()
  
  const [editStep, setEditStep] = useState(1)
  
  const [tournamentName, setTournamentName] = useState(name)
  const [tournamentGame, setTournamentGame] = useState(game)
  const [tournamentUseTeams, setTournamentUseTeams] = useState(useTeams)
  const [tournamentUsersCanCreateTeams, setTournamentUsersCanCreateTeams] = useState(usersCanCreateTeams)
  const [maxTeamSize, setMaxTeamSize] = useState(teamsMaxSize)
  const [adminTeams, setAdminTeams] = useState(true)

  const [bracketType, setBracketType] = useState(bracketProperties?.type || "")
  const [invertScore, setInvertScore] = useState(bracketProperties?.options.lowerScoreIsBetter || false)
  const [bracketOptLast, setBracketOptLast] = useState(bracketProperties?.options.last || undefined)
  const [bracketOptShort, setBracketOptShort] = useState(bracketProperties?.options.short || false)
  const [ffaNbRounds, setFfaNbRounds] = useState(bracketProperties?.options.sizes?.length || 2)
  const [bracketOptSizes, setBracketOptSizes] = useState(bracketProperties?.options.sizes || [6, 6])
  const [bracketOptAdvancers, setBracketOptAdvancers] = useState(bracketProperties?.options.advancers || [3])
  const [bracketOptLimit, setBracketOptLimit] = useState(bracketProperties?.options.limit || 1)
  
  const lan = lanResult?.lan
  const lanStartDate = lan?.startDate || {day: 0, hour: 0, min: 0}
  const lanEndDate = lan?.endDate || {day: 1, hour: 0, min: 0}

  const [tournamentStartDay, setTournamentStartDay] = useState(startTime?.day || lanStartDate.day)
  const [tournamentStartHour, setTournamentStartHour] = useState(startTime?.hour || lanStartDate.hour)
  const [tournamentStartMins, setTournamentStartMins] = useState(startTime?.min || lanStartDate.min)
  const [tournamentGTSLeaders, setTournamentGTSLeaders] = useState(globalTournamentSettings?.leaders || lan?.defaultTournamentSettings.leaders || [10, 6, 4, 2])
  const [tournamentGTSDefault, setTournamentGTSDefault] = useState(globalTournamentSettings?.default || lan?.defaultTournamentSettings.default || 1)
  const [tournamentComments, setTournamentComments] = useState(comments)
  
  const gamesList = gamesResult?.games || []

  async function publishTournament() {
    id = id == "new" ? Date.now().toString() : id

    await client.request<EditTournamentMutation, EditTournamentMutationVariables>(EDIT_TOURNAMENT_MUTATION, {
      id: id,
      name: tournamentName,
      game: tournamentGame,
      status: status,
      useTeams: tournamentUseTeams,
      usersCanCreateTeams: tournamentUsersCanCreateTeams,
      teamsMaxSize: maxTeamSize,
      bracketProperties: {
        type: bracketType,
        options: {
          last: bracketOptLast,
          short: bracketOptShort,
          lowerScoreIsBetter: invertScore,
          sizes: bracketOptSizes,
          advancers: bracketOptAdvancers,
          limit: bracketOptLimit
        }
      },
      startTime: {
        day: tournamentStartDay,
        hour: tournamentStartHour,
        min: tournamentStartMins
      },
      globalTournamentSettings: { leaders: tournamentGTSLeaders, default: tournamentGTSDefault },
      comments: tournamentComments,
    })

    await mutate(GET_TOURNAMENTS_QUERY)
    router.push("/tournaments/" + id)

  }

  return (
    <div className='tournamentEdit is-flex is-flex-direction-column'>
      <div className='flat-box is-title big has-background-secondary-level py-1'>NOUVEAU TOURNOI</div>
      <div className='tournamentEditStepsList is-flex'>
        <div className={`tournamentEditStep is-title medium ${editStep > 1 ? 'is-clickable' : ''} ${editStep == 1 ? 'is-active' : ''}`} onClick={() => editStep > 1 && setEditStep(1)}>
          <div className='name'>1. Sélection du jeu</div>
          <div className='bg'></div>
        </div>
        <div className={`tournamentEditStep is-title medium ${editStep > 2 ? 'is-clickable' : ''} ${editStep == 2 ? 'is-active' : ''}`} onClick={() => editStep > 2 && setEditStep(2)}>
          <div className='name'>2. Type de matchs</div>
          <div className='bg'></div>
        </div>
        <div className={`tournamentEditStep is-title medium ${editStep > 3 ? 'is-clickable' : ''} ${editStep == 3 ? 'is-active' : ''}`} onClick={() => editStep > 3 && setEditStep(3)}>
          <div className='name'>3. Paramètres</div>
          <div className='bg'></div>
        </div>
        <div className={`tournamentEditStep is-title medium ${editStep == 4 ? 'is-active' : ''}`}>
          <div className='name'>4. Informations</div>
          <div className='bg'></div>
        </div>
      </div>

      <div className='tournamentEditStepOptions flat-box has-background-secondary-level is-flex is-flex-direction-column is-flex-grow-1'>  
        {/* Tounrament name and game selection */}
        {editStep == 1 &&
        <div className='is-unselectable'>
          <div className='is-flex is-align-items-center field'>
            <div className='mr-3'>Nom du tournoi :</div>
            <div>
              <input className='input' type="text" placeholder="Nom du tournoi" value={tournamentName} onChange={(e) => {setTournamentName(e.target.value);}}/>
            </div>
          </div>
          <div className='is-flex is-align-items-center field'>
            <div className='mr-3'>Jeu :</div>
            <CustomSelect
              variable={tournamentGame}
              setter={(v: string) => setTournamentGame(Number(v))}
              items={gamesList.sort((a,b) => a.id == -1 ? -1 : b.id == -1 ? 1 : a.name < b.name ? -1: a.name == b.name ? 0 : 1).map(game => {return {label: game.name, value: game.id}})}
              itemsToShow={20}
            />
          </div>
          <div className="mt-3 globalTournamentOptions">
            <div className='mb-3'>Points gagnés pour ce tournoi :</div>
            <div className='is-flex is-flex-wrap-wrap topRanksPoints pl-6'>
              <div className='rankPoints is-flex is-flex-direction-column mr-4'>
                <div className='rank has-text-right has-text-weight-normal'>Place :</div>
                <div className='points has-text-right'>Points :</div>
              </div>
              {tournamentGTSLeaders.map( (points, index) => 
                <div key={index} className="rankPoints is-flex is-flex-direction-column">
                  <div className="rank is-flex is-justify-content-center is-align-items-center">{index + 1}</div>
                  <input className="points" type="number" value={String(tournamentGTSLeaders[index])} onChange={(e) => setTournamentGTSLeaders(tournamentGTSLeaders.map((pts, idx) => idx == index ? Number(e.target.value) : tournamentGTSLeaders[idx]))}></input>
                </div>
              )}
              <div className="rankPoints is-flex is-flex-direction-column">
                <div className="rank is-flex is-justify-content-center is-align-items-center">5 et +</div>
                <input className="points" type="number" value={String(tournamentGTSDefault)} onChange={(e) => setTournamentGTSDefault(Number(e.target.value))}></input>
              </div>
            </div>
            <div className='is-size-7 mt-2 pl-6'>Dans ce tableau, indique le nombre de points que les joueurs recevront en fonction de leur classement.</div>
          </div>
          <div className='nextStep-button'>
            <CustomButton
              callback={() => setEditStep(2)}
              colorClass='has-background-primary-accent'
              contentItems={['Suivant']}
            />
          </div>
        </div>
        }

        {/* Games type */}
        {editStep == 2 &&
        <div className='is-unselectable'>
          <div>Sélectionne le type de matchs pour ton tournoi :</div>
          <div className='is-flex is-align-items-center is-justify-content-space-around mt-4 mb-6'>
            <div className='is-flex is-flex-direction-column is-align-items-center'>
              <div className={`svgSelection is-clickable ${bracketType == 'Duel' ? 'is-active' : ''}`} onClick={() => setBracketType("Duel")}>
                <DuelSVG/>
              </div>
              <div className='is-title medium my-3'>DUEL</div>
              <div className='typeDescription is-size-7 has-text-centered'>Sélectionne le mode Duel si le jeu fait s’opposer 2 camps lors d’un duel qui fera ressortir un gagnant et un perdant.</div>
            </div>
            <div className='is-flex is-flex-direction-column is-align-items-center'>
              <div className={`svgSelection is-clickable ${bracketType == 'FFA' ? 'is-active' : ''}`} onClick={() => setBracketType("FFA")}>
              <FFASVG/>

              </div>
              <div className='is-title medium my-3'>CLASSEMENT</div>
              <div className='typeDescription is-size-7 has-text-centered'>Sélectionne le mode Classement si le jeu fait s’opposer plus de 2 camps et qu’il donne un résultat sous forme de classement.</div>
            </div>
          </div>
          <div className='is-flex is-align-items-start'>
            <div className='mr-3'>Type de score :</div>
            <div className='is-flex is-flex-direction-column'>
              <CustomRadio variable={invertScore} setter={setInvertScore} items={[{label:'Score classique', value:false}, {label:'Score inversé', value:true}]}/>
              <div className='mx-3 is-size-7'>Sélectionne <i>score classique</i> si le camp gagnant est celui qui a le plus haut score en fin de partie. Dans le cas contraire, bien sûr, sélectionne <i>Score inversé</i>.</div>
            </div>
          </div>
          <div className='nextStep-button'>
            <CustomButton
              active={bracketType == "FFA" || bracketType == "Duel"}
              callback={() => setEditStep(3)}
              colorClass='has-background-primary-accent'
              contentItems={['Suivant']}
            />
          </div>
        </div>
        }

        {/* Parameters */}
        {editStep == 3 &&
          <div className='is-unselectable'>
            <div>Sélectionne le type d&apos;opposants des matchs :</div>
            <div className='is-flex is-align-items-center is-justify-content-space-around mt-4 mb-4'>
              <div className='is-flex is-flex-direction-column is-align-items-center'>
                <div className={`svgSelection is-clickable ${tournamentUseTeams == false ? 'is-active' : ''}`} onClick={() => setTournamentUseTeams(false)}>
                  {bracketType == 'Duel' ? <DuelSoloSVG/> : <FFASoloSVG/>}
                </div>
                <div className='is-title medium my-3'>SOLO</div>
              </div>
              <div className='is-flex is-flex-direction-column is-align-items-center'>
                <div className={`svgSelection is-clickable ${tournamentUseTeams == true ? 'is-active' : ''}`} onClick={() => setTournamentUseTeams(true)}>
                {bracketType == 'Duel' ? <DuelTeamSVG/> : <FFATeamSVG/>}
                </div>
                <div className='is-title medium my-3'>ÉQUIPES</div>
              </div>
            </div> 
            {bracketType == 'FFA' &&
              <div className='is-size-6'>
                <div className='is-flex is-align-items-center'>
                  <div className='mr-3 is-size-5'>Nombre de manches :</div>
                  <CustomSelect
                    variable={ffaNbRounds}
                    setter={(value: string) => {
                      if(Number(value) >= 1) {
                        setFfaNbRounds(Number(value))
                        setBracketOptSizes(Array.from(Array(Number(value)), (_, i) => bracketOptSizes[i] || 6))
                        setBracketOptAdvancers(Array.from(Array(Number(value) - 1), (_, i) => bracketOptAdvancers[i] || 3))
                      }
                    }}
                    items={range(1, 10, 1).map(d =>{return {label: String(d), value: d}})}
                    itemsToShow={6}
                  />
                </div>
                <div className='is-flex ffa-sequence my-2 is-align-items-stretch'>
                  <div className='is-size-5 mt-4'>Déroulement du tournoi :</div>
                  <div className='is-flex is-flex-direction-column is-align-items-stretch mt-0 mr-3'>
                    <div className='ffa-round-name is-align-items-start is-justify-content-start'></div>
                    <div className='ffa-round-nb-select my-1 is-justify-content-end is-align-items-center'>{tournamentUseTeams == true ? "Équipes" : tournamentUseTeams == false ? "Joueurs" : "Opposants"} max par match :</div>
                    <div className='ffa-round-nb-select my-1 is-justify-content-end is-align-items-center ml-4'>Qualifiés pour la manche suivante :</div>
                    <div className='ffa-max-players is-justify-content-end mt-2'>Nombre {tournamentUseTeams == true ? "d'équipes" : tournamentUseTeams == false ? "de joueurs" : "d'opposants"} max dans le tournoi :</div>
                  </div>
                  <div className='is-flex is-flex-direction-column'>
                    <div className='is-flex'>
                    {bracketOptSizes.map((_,i) =>
                      <div key={i} className='is-flex is-flex-direction-column is-align-items-center mr-3'>
                        <div className='ffa-round-name'>Manche {i+1}</div>
                        <CustomSelect
                          variable={bracketOptSizes[i]}
                          setter={(v: string) =>
                            setBracketOptSizes(bracketOptSizes.slice(0, i).concat([Number(v)], bracketOptSizes.slice(i+1)))
                          }
                          items={range(i == 0 ? 2 : bracketOptAdvancers[i-1] > 2 ? bracketOptAdvancers[i-1] : 2, i == 0 ? 128 : bracketOptAdvancers[i-1] * 5, i == 0 ? 1 : bracketOptAdvancers[i-1]).map(d =>{return {label: String(d), value: d}})}
                          customClass='ffa_nb_round_select mt-1'
                          itemsToShow={6}
                        />
                        {i < ffaNbRounds - 1 ?
                          <CustomSelect
                            variable={bracketOptAdvancers[i]}
                            setter={(v: string) =>
                              setBracketOptAdvancers(bracketOptAdvancers.slice(0, i).concat([Number(v)], bracketOptAdvancers.slice(i+1)))
                            }
                            items={range(1, bracketOptSizes[i], 1).map(d =>{return {label: String(d), value: d}})}
                            customClass='ffa_nb_round_select mt-2'
                            itemsToShow={6}
                          />
                          :
                          <div className='ffa-round-nb-select my-1'></div>
                        }
                      </div>
                    )}
                    </div>
                    <div className='ffa-max-players is-justify-content-start mt-3'>{GetFFAMaxPlayers(bracketOptSizes, bracketOptAdvancers)}</div>
                  </div>
                </div>
              </div>
            }
            {bracketType == 'Duel' &&
              <div className='is-flex is-align-items-start mb-5'>
                <div className='mr-3'>Rattrapage :</div>
                <div className='is-flex is-flex-direction-column'>
                  <CustomRadio variable={bracketOptLast} setter={setBracketOptLast} items={[{label:'non', value:Duel.WB}, {label:'oui', value:Duel.LB}]}/>
                  <div className='mx-3 is-size-7 longDescription'>En sélectionnant <i>non</i>, le tounois sera à élimination directe, une défaite et zou, tu dégages ! En sélectionnant <i>oui</i>, les joueurs qui perdent une première fois restent en compétition. Au prix de sang et de larmes ils pourront revenir au sommet. Mais en cas de seconde défaite prends ton flambeau, la sentance sera irrévocable.</div>
                </div>
              </div>
            }
            {bracketType == 'Duel' &&
              <div className='is-flex is-align-items-start mb-5'>
                <div className='mr-3'>Format court :</div>
                <div className='is-flex is-flex-direction-column'>
                  <CustomRadio variable={bracketOptShort} setter={setBracketOptShort} items={[{label:'non', value:false}, {label:'oui', value:true}]}/>
                  {bracketOptLast == Duel.LB &&
                    <div className='mx-3 is-size-7 longDescription'>En sélectionnant <i>oui</i>, il n&apos;y aura pas de double finale. Le gagnant du rattrapage pourra voler la victoire contre le gagnant du tableau principal en une rencontre. C&apos;est pas juste, mais c&apos;est comme ça. En sélectionnant <i>non</i>, la justice reprend le dessus et le gagnant sera alors vraiment celui ayant le moins de défaites.</div>
                  }
                  {bracketOptLast == Duel.WB &&
                    <div className='mx-3 is-size-7 longDescription'>En sélectionnant <i>oui</i>, il n&apos;y aura pas de petite finale. Premier, second, les autres sont des perdants. En sélectionnant <i>non</i>, on connaitra le vainqueur de la médaille en chocolat.</div>
                  }
                  {bracketOptLast == undefined &&
                    <div className='mx-3 is-size-7 longDescription'>Sélectionne une option de rattrapage pour avoir des précisions sur ce paramètre</div>
                  }
                </div>
              </div>
            }
            {tournamentUseTeams &&
              <>
                <div className='is-flex is-align-items-center field mb-4 is-size-6'>
                  <div className='mr-3 is-size-5'>Nombre de joueurs par équipe :</div>
                  <CustomSelect
                    variable={maxTeamSize}
                    setter={(v: string) => setMaxTeamSize(Number(v))}
                    items={range(2, 64, 1).map(d =>{return {label: String(d), value: d}})}
                    itemsToShow={4}
                    showOnTop={true}
                  />
                </div>
                <div className='is-flex is-align-items-center is-size-6'>
                  <div className='mr-3 is-size-5'>Les joueurs peuvent créer des équipes :</div>
                  <div className='is-flex is-flex-direction-column'>
                    <CustomRadio variable={tournamentUsersCanCreateTeams} setter={setTournamentUsersCanCreateTeams} items={[{label:'non', value:false}, {label:'oui', value:true}]}/>
                  </div>
                </div>
              </>
            }
            <div className='nextStep-button'>
              <CustomButton
                active={(tournamentUseTeams) != undefined && ((bracketType == 'FFA') || (bracketType == 'Duel' && bracketOptLast != undefined))}
                callback={() => setEditStep(4)}
                colorClass='has-background-primary-accent'
                contentItems={['Suivant']}
              />
            </div>
          </div>
        }

        {/* Information */}
        {editStep == 4 &&
        <div className='is-unselectable'>
          <div className='field is-flex is-align-items-start mb-5'>
            <p className='mr-3'>Début du tournoi :</p>
            <div className='is-flex is-flex-direction-column'>
              <div className='is-flex is-align-items-center'>
                <CustomSelect
                  variable={tournamentStartDay}
                  setter={(v: string) => setTournamentStartDay(Number(v))}
                  items={[...range(lanStartDate.day, 6, 1), ...range(0, lanEndDate.day, 1)].map(d =>{return {label: Days[d], value: d}})}
                  customClass='mr-3'
                />
                <CustomSelect
                  variable={tournamentStartHour}
                  setter={(v: string) => setTournamentStartHour(Number(v))}
                  items={range(tournamentStartDay == lanStartDate.day ? lanStartDate.hour : 0, tournamentStartDay == lanEndDate.day ? lanEndDate.hour - 1 : 23, 1).map(d =>{return {label: String(d) + "h ", value: d}})}
                  customClass='mr-1'
                  itemsToShow={7}
                />
              </div>
              <div className="is-size-7 mt-1">Cette info est indicative seulement, le tournoi sera démarré manuellement</div>
            </div>
          </div>
          <div className='is-flex is-align-items-start'>
            <p className='mr-3'>Commentaires :</p>
            <div className='is-flex is-flex-direction-column is-flex-grow-1'>
              <textarea placeholder="Commentaires" value={tournamentComments} onChange={(e) => {setTournamentComments(e.target.value);}} rows={8} />
              <div className='longDescription is-size-7'>Dans cette zone tu peux ajouter d’autres informations utiles pour le tournoi comme par exemple des règles, l’emplacement du jeu, ou les identifiants pour le serveur.</div>
            </div>
          </div>
          <div className='nextStep-button'>
            <CustomButton
              callback={publishTournament}
              colorClass='has-background-primary-accent'
              contentItems={['Publier']}
            />
          </div>
        </div>
        }
      </div>
    </div>
  )
}