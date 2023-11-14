import Head from 'next/head'
import { useLan, useMe, usePlayers, useTournament } from "../../lib/hooks";
import TournamentsList from '../../components/tournament/tournaments-list';
import { useRouter } from 'next/router';
import { IronUser } from '../../lib/session/config';
import { client } from '../../lib/gql/client';
import { AddPlayersToTeamMutation, AddPlayersToTeamMutationVariables, AddPlayerToTournamentMutation, AddPlayerToTournamentMutationVariables, BalanceTournamentMutation, BalanceTournamentMutationVariables, EditTournamentMutation, EditTournamentMutationVariables, ForfeitOpponentFromTournamentMutation, ForfeitOpponentFromTournamentMutationVariables, MovePlayerMutation, MovePlayerMutationVariables, MoveTeamMutation, MoveTeamMutationVariables, NewTournamentTeamMutation, NewTournamentTeamMutationVariables, Player, RemovePlayersFromTeamMutation, RemovePlayersFromTeamMutationVariables, RemovePlayerFromTournamentMutation, RemovePlayerFromTournamentMutationVariables, RemoveTournamentMutation, RemoveTournamentMutationVariables, RemoveTournamentTeamMutation, RemoveTournamentTeamMutationVariables, RenameTournamentTeamMutation, RenameTournamentTeamMutationVariables, StartTournamentMutation, StartTournamentMutationVariables, StopTournamentMutation, StopTournamentMutationVariables, Tournament, TournamentStatus, TournamentTeam, ValidateTournamentMutation, ValidateTournamentMutationVariables } from '../../__generated__/gql/types';
import { ADD_PLAYERS_TO_TEAM_MUTATION, ADD_PLAYER_TO_TOURNAMENT_MUTATION, BALANCE_TOURNAMENT_MUTATION, EDIT_TOURNAMENT_MUTATION, FORFEIT_OPPONENT_FROM_TOURNAMENT_MUTATION, GET_TOURNAMENT_QUERY, MOVE_PLAYER_MUTATION, MOVE_TEAM_MUTATION, NEW_TOURNAMENT_TEAM_MUTATION, REMOVE_PLAYERS_FROM_TEAM_MUTATION, REMOVE_PLAYER_FROM_TOURNAMENT_MUTATION, REMOVE_TOURNAMENT_MUTATION, REMOVE_TOURNAMENT_TEAM_MUTATION, RENAME_TOURNAMENT_TEAM_MUTATION, START_TOURNAMENT_MUTATION, STOP_TOURNAMENT_MUTATION, VALIDATE_TOURNAMENT_MUTATION } from '../../lib/gql/operations/operations';
import { mutate } from 'swr';
import { useEffect, useState } from 'react';
import BracketViewer from '../../components/tournament/bracket-viewer';
import { BalanceSVG, BinSVG, DistributeSVG, ForfaitSVG, LeaveSVG, PanSVG, ParticipateSVG, PauseSVG, RandomSVG, RollBackSVG, StartSVG, SubsribedSVG, ThumbDownSVG, ThumbUpSVG, ZoomInSVG, ZoomOutSVG } from '../../lib/data/svg-container';
import { CustomButton } from '../../components/elements/custom-button';
import { CustomModalBinary } from '../../components/elements/custom-modal';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Days, GetFFAMaxPlayers } from '../../lib/utils';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { Draggable } from '../../components/dnd/Draggable';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { Sortable } from '../../components/dnd/Sortable';
import { SmartDndPointerSensor } from '../../lib/dndutils/smartDndPointerSensor';
import { FormattedTextWithUrls } from '../../components/elements/formatted-text-url';


export default function TournamentsPage() {

  const router = useRouter()
  const { t_id } = router.query
  console.log("t_id", t_id)
  const { data: meResult, error: meError } = useMe()
  const { data: tournamentResult, error: tournamentError } = useTournament(String(t_id))
  console.log("terror", tournamentError)
  const { data: lanResult, error: lanError } = useLan()

  const user = meResult?.me
  if (!user) {
    return null
  }

  if (!t_id || Array.isArray(t_id)) {
    return null
  }

  const tournament = tournamentResult?.tournament

  return (
    <>
      <Head>
        <title>{lanResult?.lan.name || ""} - {t_id == "new" ? "Nouveau tournoi" : "Tournoi " + tournament?.name}</title>
      </Head>

      <div className="is-full-height is-flex p-3">
        <TournamentsList selected={t_id} />
        {tournament != undefined ?
          <ShowTournament tournament={tournament} user={user} />
          :
          badTournamentID()
        }
      </div>
    </>
  )
}

export function badTournamentID() {
  return (
    <div className='tournamentInfo has-background-secondary-level is-justify-content-center is-align-items-center'>
      <div>404 - Tournament not found</div>
    </div>
  )
}

interface ShowTournamentProps {
  tournament: Tournament;
  user: IronUser;
}

export function ShowTournament({ tournament, user }: ShowTournamentProps) {
  const router = useRouter()
  const [infoOpponentName, setInfoOpponentName] = useState("")
  const [showConfirmValidate, setShowConfirmValidate] = useState(false)

  useEffect(() => {
    if (infoOpponentName == "") return
    const bracketOpponentInfosContainer = document.getElementById('bracketOpponentInfosContainer')
    const bracketOpponentInfos = document.getElementById('bracketOpponentInfos')
    if (!bracketOpponentInfosContainer || !bracketOpponentInfos) return
    bracketOpponentInfos.classList.remove('animateFromTopToBottom')
    if (bracketOpponentInfosContainer.offsetHeight < bracketOpponentInfos.offsetHeight)
      bracketOpponentInfos.classList.add('animateFromTopToBottom')
  }, [infoOpponentName])


  var { t_id } = router.query
  if (!t_id || Array.isArray(t_id)) {
    return null
  }

  async function participate() {
    await client.request<AddPlayerToTournamentMutation, AddPlayerToTournamentMutationVariables>(ADD_PLAYER_TO_TOURNAMENT_MUTATION, { tournamentId: tournament.id, player: user.username })
    await mutate([GET_TOURNAMENT_QUERY, {id: tournament.id}])
  }

  async function dontParticipate() {
    await client.request<RemovePlayerFromTournamentMutation, RemovePlayerFromTournamentMutationVariables>(REMOVE_PLAYER_FROM_TOURNAMENT_MUTATION, { tournamentId: tournament.id, player: user.username })
    await mutate([GET_TOURNAMENT_QUERY, {id: tournament.id}])
  }

  async function balanceTournament() {
    await client.request<BalanceTournamentMutation, BalanceTournamentMutationVariables>(BALANCE_TOURNAMENT_MUTATION, { id: tournament.id })
    await mutate([GET_TOURNAMENT_QUERY, {id: tournament.id}])
  }

  async function validateTournament() {
    await client.request<ValidateTournamentMutation, ValidateTournamentMutationVariables>(VALIDATE_TOURNAMENT_MUTATION, { id: tournament.id })
    await mutate([GET_TOURNAMENT_QUERY, {id: tournament.id}])
  }

  return (
    <div className='is-flex is-flex-direction-column'>
      <div className={`tournamentInfoTitle is-title big has-background-secondary-level ${[TournamentStatus.Open, TournamentStatus.Balancing].includes(tournament.status) ? 'mb-3 is-justify-content-center' : 'is-justify-content-space-between'}`}>
        <div className='mx-3'>Tournoi {tournament.name}</div>
        {user.isAdmin && tournament.status == TournamentStatus.Validating &&
          <div className='tournamentValidationButtonContainer'>
            <CustomButton callback={() => setShowConfirmValidate(true)} contentItems={[ThumbUpSVG(), "Valider"]} tooltip='Terminer le tournoi' customClasses="small-button" colorClass='has-background-primary-accent' />
            <CustomModalBinary show={showConfirmValidate} onHide={() => setShowConfirmValidate(false)} content={"Es-tu sûr de valider le tournoi ?"} cancelButton={true} onConfirm={validateTournament} />
          </div>
        }
      </div>
      <div className='tournamentInfo m-0'>
        {[TournamentStatus.Open, TournamentStatus.Balancing].includes(tournament.status) &&
          <>
            <TournamentInfoSettings tournament={tournament} user={user} />
            {tournament.useTeams ?
              <TournamentInfoTeams tournament={tournament} user={user} participate={participate} dontParticipate={dontParticipate} balanceTournament={balanceTournament} />
              :
              <TournamentInfoPlayers tournament={tournament} user={user} participate={participate} dontParticipate={dontParticipate} balanceTournament={balanceTournament} />
            }
          </>
        }
        {![TournamentStatus.Open, TournamentStatus.Balancing].includes(tournament.status) &&
          <div className='tournamentInfoRunning has-background-secondary-level is-align-content-stretch'>
            <TournamentInfoRunning tournament={tournament} user={user} />
            <div className='bracketView has-background-primary-level'>
              <TransformWrapper minScale={0.5} maxScale={1} panning={{ excluded: ["input"] }} doubleClick={{ disabled: true }} disablePadding={true}>
                <TransformComponent >
                  <BracketViewer tournament={tournament} setterOpponentToShowInfo={setInfoOpponentName} />
                </TransformComponent>
              </TransformWrapper>
              <div className='bracketNavHelpers'>
                <div className='is-flex is-align-items-center'>
                  <ZoomInSVG />/<ZoomOutSVG />
                  <div className='ml-1'>Molette</div>
                </div>
                <div className='is-flex is-align-items-center'>
                  <PanSVG />
                  <div className='ml-1'>Cliquer-glisser</div>
                </div>
                {/* <div className='is-flex is-align-items-center'>
                  <FitSVG/>
                  <div className='ml-1'>Espace</div>
                </div> */}
              </div>
              {tournament.teams && tournament.teams.map(team => team?.name).includes(infoOpponentName) &&
                <div id='bracketOpponentInfosContainer' className={`bracketOpponentInfosContainer`}>
                  <div className='bracketOpponentInfos'>
                    <div id='bracketOpponentInfosName' className='py-2 is-size-4 opponentName'>Équipe {infoOpponentName}</div>
                    <div id='bracketOpponentInfos' className='opponentInfo pl-4'>
                      {tournament.teams.find(team => team?.name == infoOpponentName)?.players.sort((strA, strB) => strA.toLowerCase().localeCompare(strB.toLowerCase())).map(player =>
                        <div key={player} className='is-size-5'>{player}</div>
                        )}
                    </div>
                  </div>
                </div>
              }
              {!tournament.teams && tournament.players.map(p => p.username).includes(infoOpponentName) &&
                <div className={`bracketOpponentInfosContainer`}>
                  <div className='mb-2 is-size-4 opponentName'>Joueur {infoOpponentName}</div>
                  <div className='opponentInfo pl-4'>
                    <div className='is-size-5'>Équipe : {tournament.players.find(p => p.username == infoOpponentName)?.team || 'Aucune'}</div>
                    <div className='is-size-5'>IP: {(tournament.players.find(p => p.username == infoOpponentName)?.ips || ['-']).at(-1)}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  )
}

interface TournamentInfoProps {
  tournament: Tournament
  user: IronUser
}

function TournamentInfoSettings({ tournament, user }: TournamentInfoProps) {
  const router = useRouter()

  const [showConfirmStart, setShowConfirmStart] = useState(false)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)

  async function startTournament() {
    await client.request<StartTournamentMutation, StartTournamentMutationVariables>(START_TOURNAMENT_MUTATION, { id: tournament.id })
    await mutate([GET_TOURNAMENT_QUERY, {id: tournament.id}])
  }

  async function editTournament() {
    router.push(`/edit/${tournament.id}`)
  }
  
  async function cancelTournament() {
    await client.request<RemoveTournamentMutation, RemoveTournamentMutationVariables>(REMOVE_TOURNAMENT_MUTATION, { id: tournament.id })
    router.push("/")
  }

  return (
    <div className='tournamentInfoSettings is-flex is-flex-direction-column p-3'>
      <div className='is-title medium is-uppercase'>Informations sur le tournoi</div>
      <div className='ml-3 is-size-5 is-flex is-flex-direction-column is-scrollable'>
        {/* Type de matchs */}
        {tournament.bracketProperties.type == 'Duel' && <div className='mb-3'>Type de matchs : Affrontement de deux {tournament.useTeams ? "équipes" : "joueurs"}</div>}
        {tournament.bracketProperties.type == 'FFA' && <div className='mb-3'>Type de matchs : FFA en {tournament.useTeams ? "équipe" : "solo"}</div>}
        {/* Points rapportés */}
        <div className='mb-3 globalTournamentOptions'>
          <div className='mb-3'>Points gagnés pour ce tournoi :</div>
          <div className='is-flex is-flex-wrap-wrap topRanksPoints pl-6 is-size-5'>
            <div className='rankPoints is-flex is-flex-direction-column mr-4'>
              <div className='rank has-text-right has-text-weight-normal'>Place :</div>
              <div className='points has-text-right'>Points :</div>
            </div>
            {tournament.globalTournamentSettings.leaders.map((points, index) =>
              <div key={index} className="rankPoints is-flex is-flex-direction-column">
                <div className="rank is-flex is-justify-content-center is-align-items-center">{index + 1}</div>
                <div className="points">{points}</div>
              </div>
            )}
            <div className="rankPoints is-flex is-flex-direction-column">
              <div className="rank is-flex is-justify-content-center is-align-items-center">5 et +</div>
              <div className="points">{tournament.globalTournamentSettings.default}</div>
            </div>
          </div>
        </div>
        {/* Joueurs incrits */}
        <div className='is-flex'>
          <div>Joueurs inscrits : {tournament.players.length}</div>
          {tournament.bracketProperties.type == 'FFA' &&
            tournament.bracketProperties.options.sizes &&
            tournament.bracketProperties.options.advancers &&
            <div className='fade-text ml-1'>
              / {GetFFAMaxPlayers(tournament.bracketProperties.options.sizes, tournament.bracketProperties.options.advancers) * (tournament.useTeams ? tournament.teamsMaxSize || 1 : 1)} max
            </div>
          }
        </div>
        {/* Équipes créées */}
        {tournament.useTeams &&
          <div className='mb-3 is-flex'>
            <div>Équipes créées : {tournament.teams ? tournament.teams.length : 0}</div>
            {tournament.bracketProperties.type == 'FFA' &&
              tournament.bracketProperties.options.sizes &&
              tournament.bracketProperties.options.advancers &&
              <div className='fade-text ml-1'>
                / {GetFFAMaxPlayers(tournament.bracketProperties.options.sizes, tournament.bracketProperties.options.advancers)} max
              </div>
            }
          </div>
        }
        {/* Début du tournoi */}
        <div className='mb-3 is-flex'>
          <div className='mr-3'>Début du tournoi :</div>
          <div className='has-text-weight-semibold'>{Days[tournament.startTime.day]} {tournament.startTime.hour}h</div>
        </div>
        {/* Commentaires */}
        {tournament.comments && <div className=''>Commentaires :</div>}
        {tournament.comments && <div className='comments ml-6 is-scrollable enable-line-break'><FormattedTextWithUrls text={tournament.comments} /></div>}
      </div>
      <div className='is-flex-grow-1'></div>
      {user.isAdmin &&
        <div className='bottomButtons is-flex is-justify-content-end'>
          <CustomButton callback={editTournament} contentItems={[SubsribedSVG(), "Éditer"]} tooltip='Modifier les paramètres du tournoi' colorClass='has-background-primary-level' />
          <CustomButton callback={() => setShowConfirmCancel(true)} contentItems={[BinSVG(), "Annuler"]} colorClass='has-background-primary-level' />
          <CustomModalBinary show={showConfirmCancel} onHide={() => setShowConfirmCancel(false)} content={"Es-tu sûr de vouloir supprimer ce tournoi ?"} cancelButton={true} onConfirm={cancelTournament} />
          <CustomButton callback={() => setShowConfirmStart(true)} contentItems={[StartSVG(), "Démarrer"]} colorClass='has-background-primary-accent' />
          <CustomModalBinary show={showConfirmStart} onHide={() => setShowConfirmStart(false)} content={"Es-tu sûr de vouloir démarrer ce tournoi ?"} cancelButton={true} onConfirm={startTournament} />
        </div>
      }
    </div>
  )
}

function TournamentInfoRunning({ tournament, user }: TournamentInfoProps) {
  const router = useRouter()
  const { data: lanResult, error: lanError } = useLan()
  const [editingInfo, setEditingInfo] = useState(false)
  const [tournamentGTS, setTournamentGTS] = useState(tournament.globalTournamentSettings)
  const [tournamentComments, setTournamentComments] = useState(tournament.comments)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)
  const [showConfirmStructuralEdit, setShowConfirmStructuralEdit] = useState(false)
  const [showConfirmForfeit, setShowConfirmForfeit] = useState(false)

  const lan = lanResult?.lan

  useEffect(() => {
    setEditingInfo(false)
    setTournamentGTS(tournament.globalTournamentSettings)
    setTournamentComments(tournament.comments)
  }, [tournament])

  async function editRatioComments() {
    await client.request<EditTournamentMutation, EditTournamentMutationVariables>(EDIT_TOURNAMENT_MUTATION, { id: tournament.id, globalTournamentSettings: tournamentGTS, comments: tournamentComments })
    await mutate([GET_TOURNAMENT_QUERY, {id: tournament.id}])
  }

  async function stopTournament() {
    await client.request<StopTournamentMutation, StopTournamentMutationVariables>(STOP_TOURNAMENT_MUTATION, { id: tournament.id })
    await mutate([GET_TOURNAMENT_QUERY, {id: tournament.id}])
  }

  async function cancelTournament() {
    await client.request<RemoveTournamentMutation, RemoveTournamentMutationVariables>(REMOVE_TOURNAMENT_MUTATION, { id: tournament.id })
    router.push("/")
  }

  async function forfeit(opponentName: string) {
    await client.request<ForfeitOpponentFromTournamentMutation, ForfeitOpponentFromTournamentMutationVariables>(FORFEIT_OPPONENT_FROM_TOURNAMENT_MUTATION, { tournamentId: tournament.id, opponent: opponentName })
    await mutate([GET_TOURNAMENT_QUERY, {id: tournament.id}])
  }

  async function playPauseTournament() {
    if (tournament.status == TournamentStatus.Running)
      await client.request<StopTournamentMutation, StopTournamentMutationVariables>(STOP_TOURNAMENT_MUTATION, { id: tournament.id })
    else
      await client.request<StartTournamentMutation, StartTournamentMutationVariables>(START_TOURNAMENT_MUTATION, { id: tournament.id })
    await mutate([GET_TOURNAMENT_QUERY, {id: tournament.id}])
  }

  return (
    <div className='info is-flex is-flex-direction-column'>
      <div className={`mb-3 globalTournamentOptions ${editingInfo ? "editing" : ""}`}>
        <div className='mb-3'>Points gagnés pour ce tournoi :</div>
        <div className='is-flex is-flex-wrap-wrap topRanksPoints pl-2 is-size-6'>
          {1 &&
            <div className='rankPoints is-flex is-flex-direction-column mr-4'>
              <div className='rank has-text-right has-text-weight-normal'>Place :</div>
              <div className='points has-text-right'>Points :</div>
            </div>
          }
          {tournament.globalTournamentSettings.leaders.map((points, index) =>
            <div key={index} className="rankPoints is-flex is-flex-direction-column">
              <div className="rank is-flex is-justify-content-center is-align-items-center">{index + 1}</div>
              {editingInfo ?
                <input className="points is-size-6" type="number" value={String(tournamentGTS.leaders[index])} onChange={(e) => setTournamentGTS({ leaders: tournamentGTS.leaders.map((pts, idx) => idx == index ? Number(e.target.value) : tournamentGTS.leaders[idx]), default: tournamentGTS.default })}></input>
                :
                <div className="points">{points}</div>
              }
            </div>
          )}
          <div className="rankPoints is-flex is-flex-direction-column">
            <div className="rank is-flex is-justify-content-center is-align-items-center">5 et +</div>
            {editingInfo ?
              <input className="points is-size-6" type="number" value={String(tournamentGTS.default)} onChange={(e) => setTournamentGTS({ leaders: tournamentGTS.leaders, default: Number(e.target.value) })}></input>
              :
              <div className="points">{tournament.globalTournamentSettings.default}</div>
            }
          </div>
        </div>
      </div>
      <div>Commentaires :</div>
      {editingInfo ?
        <textarea className='is-size-6' style={{ resize: "none" }} placeholder="Commentaires" value={tournamentComments} onChange={(e) => { setTournamentComments(e.target.value); }} rows={8} />
        :
        <div className='comments enable-line-break is-size-6 ml-2'><FormattedTextWithUrls text={tournament.comments} /></div>
      }
      <div className='is-flex-grow-1'></div>

      {!user.isAdmin && !([TournamentStatus.Validating, TournamentStatus.Done].includes(tournament.status)) && !tournament.useTeams && tournament.players.find(player => player.username == user.username) && !tournament.forfeitOpponents?.includes(user.username) &&
        <div className='is-flex is-flex-justify-items-end'>
          <div className='is-flex-grow-1'></div>
          <CustomButton callback={() => setShowConfirmForfeit(true)} contentItems={[ForfaitSVG(), "Abandonner"]} tooltip='Déclarer forfait pour ce tournoi' colorClass="has-background-primary-level" />
          <CustomModalBinary show={showConfirmForfeit} onHide={() => setShowConfirmForfeit(false)} content={"Es-tu sûr de vouloir abandonner ?"} cancelButton={true} onConfirm={() => forfeit(user.username)} />
        </div>
      }

      {user.isAdmin && (
        tournament.status != TournamentStatus.Done &&
        <>
          <div className='is-flex is-flex-wrap-wrap mt-4' style={{ gap: ".5rem" }}>
            <CustomButton callback={() => { setEditingInfo(!editingInfo); editingInfo && editRatioComments() }} tooltip={editingInfo ? undefined : 'Modifier les points et les commentaires'} contentItems={editingInfo ? ["Publier"] : [SubsribedSVG(), "Editer"]} colorClass={`${editingInfo ? 'has-background-primary-accent' : 'has-background-primary-level'}`} />
            {tournament.status == TournamentStatus.Paused &&
              <>
                <CustomButton callback={() => setShowConfirmStructuralEdit(true)} contentItems={[RollBackSVG(), "Redémarrer"]} colorClass={"has-background-primary-level"} />
                <CustomModalBinary show={showConfirmStructuralEdit} onHide={() => setShowConfirmStructuralEdit(false)} content={`Es-tu sûr de vouloir redémarrer ce tournoi ? Tu pourras éditer ${tournament.useTeams ? "les équipes et " : ""}les inscriptions, mais toute sa progression sera perdue !`} cancelButton={true} onConfirm={stopTournament} />
                <CustomButton callback={() => setShowConfirmCancel(true)} contentItems={[BinSVG(), "Annuler"]} colorClass={"has-background-primary-level"} />
                <CustomModalBinary show={showConfirmCancel} onHide={() => setShowConfirmCancel(false)} content={"Es-tu sûr de vouloir arrêter et supprimer ce tournoi ?"} cancelButton={true} onConfirm={cancelTournament} />
              </>
            }
            {tournament.status != TournamentStatus.Validating && <CustomButton callback={playPauseTournament} contentItems={tournament.status == TournamentStatus.Running ? [PauseSVG(), "Suspendre"] : [StartSVG(), "Reprendre"]} colorClass={`${tournament.status == TournamentStatus.Running ? "has-background-primary-level" : "has-background-primary-accent"}`} />}
          </div>
          <div className='mt-4'>
            <div className='is-title'>Gestion des joueurs</div>
            <div className='playersManagement is-flex is-flex-direction-column has-background-primary-level'>
              {tournament.bracketProperties.seeding?.sort((a, b) => a.opponent > b.opponent ? 1 : -1).map(opponent =>
                <div key={opponent.nb} className='tile is-flex'>
                  <div className='has-background-grey'>{opponent.opponent}</div>
                  <div className={`ffButton is-clickable fade-on-mouse-out ${tournament.forfeitOpponents?.includes(opponent.opponent) ? "has-background-primary-accent" : "has-background-grey"}`} title={tournament.forfeitOpponents?.includes(opponent.opponent) ? "Réintégrer" : "Déclarer forfait (réintégration possible)"} onClick={() => forfeit(opponent.opponent)}>
                    {tournament.forfeitOpponents?.includes(opponent.opponent) ?
                      RollBackSVG()
                      :
                      ThumbDownSVG()
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {tournament.status == TournamentStatus.Done &&
        <div>
          <div className='is-title'>Résultats</div>
          <div className='tournamentResults is-unselectable is-flex is-flex-direction-column has-background-primary-level'>
            {tournament.results?.map(playerResult =>
              <div key={playerResult.username} className='tile is-flex has-background-grey'>
                <div>{playerResult.position}</div>
                <div>{playerResult.username}</div>
                <div>{(tournament.globalTournamentSettings.leaders[playerResult.position - 1] || tournament.globalTournamentSettings.default) - (tournament.forfeitOpponents?.includes(playerResult.username) ? tournament.globalTournamentSettings.default : 0)} pts</div>
              </div>
            )}
          </div>
        </div>
      }
    </div>
  )
}


interface TournamentOpponentsProps extends TournamentInfoProps {
  participate: CallableFunction
  dontParticipate: CallableFunction
  balanceTournament: CallableFunction
}


function TournamentInfoTeams({ tournament, user, participate, dontParticipate, balanceTournament }: TournamentOpponentsProps) {
  const [showNewTeam, setShowNewTeam] = useState(false)
  const [teamName, setTeamName] = useState("")

  const [draggingPlayer, setDraggingPlayer] = useState<string | null>(null);
  const [draggingTeam, setDraggingTeam] = useState<string | null>(null);
  const [sortableTeams, setSortableTeams] = useState<(TournamentTeam&{id:string})[]>(tournament.teams?.map(team => {
    return {...team, id: 'team_' + team.name}}) || []);

  useEffect(() => {
    tournament.teams && setSortableTeams(tournament.teams.map(team => {
      return {...team, id: 'team_' + team.name}}))
  },[tournament])

  const notInTeamPlayers = tournament.players.filter(player => !(tournament.teams ? tournament.teams.flatMap(team => team?.players) : [] as string[]).includes(player.username)).map(player => player.username)
  const canAddTeam = (tournament.bracketProperties.type == 'Duel') || (tournament.bracketProperties.type == 'FFA') && ((tournament.teams || []).length < GetFFAMaxPlayers(tournament.bracketProperties.options.sizes as number[], tournament.bracketProperties.options.advancers as number[]))
  const canAddPlayer = tournament.bracketProperties.type == 'Duel' || tournament.players.length < ((tournament.teamsMaxSize as number) * GetFFAMaxPlayers(tournament.bracketProperties.options.sizes as number[], tournament.bracketProperties.options.advancers as number[]))

  async function newTeam() {
    await client.request<NewTournamentTeamMutation, NewTournamentTeamMutationVariables>(NEW_TOURNAMENT_TEAM_MUTATION, { tournamentId: tournament.id, teamName: teamName })
    await mutate([GET_TOURNAMENT_QUERY, {id:tournament.id}])
    setTeamName("")
    setShowNewTeam(false)
  }
  async function renameTeam(oldTeamName: string, newTeamName: string) {
    await client.request<RenameTournamentTeamMutation, RenameTournamentTeamMutationVariables>(RENAME_TOURNAMENT_TEAM_MUTATION, { tournamentId: tournament.id, oldTeamName: oldTeamName, newTeamName: newTeamName })
    await mutate([GET_TOURNAMENT_QUERY, {id:tournament.id}])
  }
  async function removeTeam(team: string) {
    await client.request<RemoveTournamentTeamMutation, RemoveTournamentTeamMutationVariables>(REMOVE_TOURNAMENT_TEAM_MUTATION, { tournamentId: tournament.id, teamName: team })
    await mutate([GET_TOURNAMENT_QUERY, {id:tournament.id}])
  }
  async function addPlayersToTeam(players: string[], team: string, awaitMutate: boolean = true) {
    await client.request<AddPlayersToTeamMutation, AddPlayersToTeamMutationVariables>(ADD_PLAYERS_TO_TEAM_MUTATION, { tournamentId: tournament.id, teamName: team, players: players })
    awaitMutate && await mutate([GET_TOURNAMENT_QUERY, {id:tournament.id}])
  }
  async function removePlayersFromTeams(players: string[], awaitMutate: boolean = true) {
    await client.request<RemovePlayersFromTeamMutation, RemovePlayersFromTeamMutationVariables>(REMOVE_PLAYERS_FROM_TEAM_MUTATION, { tournamentId: tournament.id, players: players })
    awaitMutate && await mutate([GET_TOURNAMENT_QUERY, {id:tournament.id}])
  }

  {/**  DEV ONLY  */ }
  const { data: playersResult, error: playersError } = usePlayers()
  async function addFakePlayer() {
    const fakePlayer = playersResult?.players.filter(player => !tournament.players.map(player => player.username).includes(player.username) && player.username != user.username).sort(() => Math.floor(Math.random() * 3) - 1)[0]
    fakePlayer && await client.request<AddPlayerToTournamentMutation, AddPlayerToTournamentMutationVariables>(ADD_PLAYER_TO_TOURNAMENT_MUTATION, { tournamentId: tournament.id, player: fakePlayer.username })
    await mutate([GET_TOURNAMENT_QUERY, {id: tournament.id}])
  }
  {/**  DEV ONLY  */ }

  async function onDragStart(event: DragStartEvent) {
    if ((event.active.id + "").includes("team_"))
      setDraggingTeam(event.active.id + "")
    else
      setDraggingPlayer(event.active.id + "")
    document.body.classList.add('is-dragging')
  }

  async function onDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (draggingPlayer) {
      document.body.classList.remove('is-dragging')
      setDraggingPlayer(null)
      // Dragging on something
      if (over?.id) {
        over.id = (over.id + "").replace('team_', '')
        const playerName = (active.id + "").replace('player_', '')
        // Dragging in "no-team" from outside
        if (over.id == "no-team" && !active.data.current?.noTeam) {
          await removePlayersFromTeams([playerName])
          // Dragging in a team from outside
        } else if (over.id != active.data.current?.team) {
          const addToTeam = tournament.teams?.filter(t => t.name == over?.id)[0]
          if (addToTeam && tournament.teamsMaxSize && addToTeam.players.length < tournament.teamsMaxSize) {
            await removePlayersFromTeams([playerName])
            await addPlayersToTeam([playerName], addToTeam.name)
          }
        }
      }
    } else if (draggingTeam) {
      document.body.classList.remove('is-dragging')
      setDraggingTeam(null)
      if(over?.id && (active.id != over.id)) {
        const teamName = (event.active.id + "").replace('team_', '')
        const oldIndex = sortableTeams.findIndex(t => t.id == active.id)
        const newIndex = sortableTeams.findIndex(t => t.id == over.id)

        const newTeamsOrders = arrayMove(sortableTeams, oldIndex, newIndex);
        setSortableTeams(newTeamsOrders)
        await client.request<MoveTeamMutation,MoveTeamMutationVariables>(MOVE_TEAM_MUTATION,{
          tournamentId:tournament.id,
          team: teamName,
          newIndex:newIndex
        })
        await mutate([GET_TOURNAMENT_QUERY, {id:tournament.id}])
      }
    }
  }

  const dndSensors = useSensors(useSensor(SmartDndPointerSensor, {activationConstraint: {distance: 10}}))

  return (
    <DndContext onDragEnd={onDragEnd} onDragStart={onDragStart} sensors={dndSensors}>
      <DragOverlay style={{opacity:".75"}}>
        {draggingPlayer ?
          (<PlayerTile playerName={draggingPlayer.replace("player_", "")} user={user} />)
          : null}
        {draggingTeam ? 
          <OverlayTeamTile tournament={tournament} teamName={draggingTeam.replace("team_", "")} user={user} /> : null}
      </DragOverlay>
      <CustomModalBinary
        show={showNewTeam}
        onHide={() => setShowNewTeam(false)}
        cancelButton={false}
        content={
          <div className='is-flex is-align-items-stretch pt-5 pl-5 pb-4'>
            <div className="has-background-primary-accent pl-1 mt-1 mx-4"></div>
            <div>
              <div className='is-title medium is-uppercase mb-5'>Nouvelle équipe</div>
              <div className="is-flex is-align-items-center">
                <div className="mr-3">Nom de l&apos;équipe : </div>
                <div>
                  <input className='input' autoFocus type="text" placeholder="Nom de l'équipe" value={teamName} onChange={(e) => { setTeamName(e.target.value) }} onKeyDown={(e) => e.key == "Enter" && newTeam()} />
                </div>
              </div>
            </div>
          </div>
        }
        onConfirm={newTeam}
        confirmCondition={() => teamName.toLowerCase() != "" && !(tournament.teams && tournament.teams.map(team => team.name.toLowerCase()).includes(teamName.toLowerCase()))}
        cantConfirmTooltip={teamName.toLowerCase() == "" ? "Le nom d'équipe ne peut pas être vide" : "Nom d'équipe déjà utilisé"}
      />
      <div className='tournamentInfoTeams is-flex is-flex-direction-column p-3'>
        <div className='is-flex is-justify-content-space-between'>
          <div className='is-title medium is-uppercase'>équipes</div>
          {(user.isAdmin || (tournament.usersCanCreateTeams && notInTeamPlayers.includes(user.username) && tournament.status == TournamentStatus.Open)) && canAddTeam &&
            <CustomButton callback={() => setShowNewTeam(true)} tooltip='Répartir les joueurs sans équipe' contentItems={[SubsribedSVG(), "New team"]} customClasses='small-button' colorClass='has-background-primary-accent' />
          }
        </div>
        <div className='teamsListContainer is-flex is-flex-direction-column has-background-primary-level'>
          <div className='teamsList p-2'>
            {(user.isAdmin && tournament.status == TournamentStatus.Balancing) ?
              <SortableContext items={sortableTeams}>
                {sortableTeams.map(team =>
                  team ?
                  <div key={team.name} className='teamTileContainer'>
                      <Sortable id={'team_' + team.name}>
                        <TeamTile
                          tournament={tournament}
                          team={team}
                          user={user}
                          renameTeam={renameTeam}
                          removeTeam={removeTeam}
                          addPlayersToTeam={addPlayersToTeam}
                          removePlayersFromTeams={removePlayersFromTeams}
                          isFull={!(tournament.useTeams && tournament.teamsMaxSize && team.players.length < tournament.teamsMaxSize)}
                          draggedPlayer={draggingPlayer}
                          couldJoin={notInTeamPlayers.includes(user.username)}
                          isDraggable={tournament.status == TournamentStatus.Balancing}
                          />
                      </Sortable>
                    </div>
                    : null
                    )}
              </SortableContext>
              :
              tournament.teams?.map(team =>
                team ?
                <div key={team.name} className='teamTileContainer'>
                  <TeamTile
                    tournament={tournament}
                    team={team}
                    user={user}
                    renameTeam={renameTeam}
                    removeTeam={removeTeam}
                    addPlayersToTeam={addPlayersToTeam}
                    removePlayersFromTeams={removePlayersFromTeams}
                    isFull={!(tournament.useTeams && tournament.teamsMaxSize && team.players.length < tournament.teamsMaxSize)}
                    draggedPlayer={draggingPlayer}
                    couldJoin={notInTeamPlayers.includes(user.username)}
                    isDraggable={tournament.status == TournamentStatus.Balancing}
                    />
                </div>
                : null
              )
            }
          </div>
          {user.isAdmin && tournament.status == TournamentStatus.Balancing &&
            <div className='bottomListInfo'>Déplace les équipes pour définir leur seed</div>
          }
        </div>
        {user.isAdmin &&
          <PlayerWithoutTeamArea tournament={tournament} notInTeamPlayers={notInTeamPlayers} user={user} addPlayersToTeam={addPlayersToTeam} />
        }
        <div className='bottomButtons is-flex is-justify-content-space-between'>
          {user.isAdmin ?
            <>
              <CustomButton callback={balanceTournament} tooltip={tournament.status == TournamentStatus.Open ? "Empêcher les joueurs d'interragir avec le tournoi, pour pouvoir les re-seeder" : "Réouvrir le tournoi aux joueurs"} contentItems={tournament.status == TournamentStatus.Open ? [StartSVG(), "Verrouiller"] : [StartSVG(), "Déverrouiller"]} colorClass='has-background-primary-level' />
              {/**  DEV ONLY  */ }
              {process.env.NODE_ENV === "development" && canAddPlayer && <CustomButton callback={addFakePlayer} contentItems={["Add player"]} colorClass='has-background-primary' />}
              {/**  DEV ONLY  */ }
              </>
            :
            <div></div>
          }
          {tournament.status == TournamentStatus.Open &&
            (tournament.players.find(player => player.username == user.username) ?
              <CustomButton callback={() => {dontParticipate(); removePlayersFromTeams([user.username]);}} contentItems={[LeaveSVG(), "Quitter"]} colorClass='has-background-secondary-accent' />
              :
              <CustomButton active={canAddPlayer} callback={participate} contentItems={[ParticipateSVG(), "Participer"]} colorClass='has-background-primary-accent' />
            )
          }
        </div>
      </div>
    </DndContext>
  )
}

function TournamentInfoPlayers({ tournament, user, participate, dontParticipate, balanceTournament }: TournamentOpponentsProps) {

  const [draggingPlayer, setDraggingPlayer] = useState<string | null>(null);
  const [sortablePlayers, setSortablePlayers] = useState<(Player&{id:string})[]>([]);

  useEffect(() => {
    setSortablePlayers(tournament.players.map(player => {
      return { ...player, id: player.username }
    }))
  },[tournament])

  const canAddPlayer = (tournament.bracketProperties.type == 'Duel' || (tournament.bracketProperties.options.sizes && tournament.bracketProperties.options.advancers && tournament.players.length < (GetFFAMaxPlayers(tournament.bracketProperties.options.sizes, tournament.bracketProperties.options.advancers)))) ? true : false

  {/**  DEV ONLY  */ }
  const { data: playersResult, error: playersError } = usePlayers()
  async function addFakePlayer() {
    const fakePlayer = playersResult?.players.filter(player => !tournament.players.map(player => player.username).includes(player.username) && player.username != user.username).sort(() => Math.floor(Math.random() * 3) - 1)[0]
    fakePlayer && await client.request<AddPlayerToTournamentMutation, AddPlayerToTournamentMutationVariables>(ADD_PLAYER_TO_TOURNAMENT_MUTATION, { tournamentId: tournament.id, player: fakePlayer.username })
    await mutate([GET_TOURNAMENT_QUERY, {id: tournament.id}])
  }
  {/**  DEV ONLY  */ }

  async function onDragStart(event: DragStartEvent) {
    setDraggingPlayer(event.active.id + "")
    document.body.classList.add('is-dragging')
  }

  async function onDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    setDraggingPlayer(null)
    document.body.classList.remove('is-dragging')
    if(over?.id && (active.id != over.id)) {
      const oldIndex = sortablePlayers.findIndex(p => p.username == active.id)
      const newIndex = sortablePlayers.findIndex(p => p.username == over.id)

      const newPlayersOrders = arrayMove(sortablePlayers, oldIndex, newIndex);
      setSortablePlayers(newPlayersOrders)
      await client.request<MovePlayerMutation,MovePlayerMutationVariables>(MOVE_PLAYER_MUTATION,{
        tournamentId:tournament.id,
        player: active.id as string,
        newIndex:newIndex
      })
      await mutate([GET_TOURNAMENT_QUERY, {id:tournament.id}])
    }
  }


  return (
    <div className='tournamentInfoPlayers is-flex is-flex-direction-column p-3'>
        <DragOverlay style={{opacity:".75"}}>
          {draggingPlayer ?
            (<PlayerTile playerName={draggingPlayer} user={user} />)
            : null}
        </DragOverlay>
      <div className='is-title medium is-uppercase'>Inscrits</div>
        <DndContext
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className='is-flex is-flex-direction-column is-flex-grow-1 has-background-primary-level p-2 is-scrollable'>
            <div className='playersList'>
              <SortableContext items={sortablePlayers} disabled={!(user.isAdmin && tournament.status == TournamentStatus.Balancing)}>
                {sortablePlayers.map(player =>
                  <div key={player.username} className='playerTileContainer'>
                    <Sortable id={player.username}>
                      <PlayerTile playerName={player.username} user={user} isDraggable={user.isAdmin && tournament.status == TournamentStatus.Balancing} />
                    </Sortable>
                  </div>
                )}
              </SortableContext>
            </div>
            {user.isAdmin && tournament.status == TournamentStatus.Balancing &&
              <div className='bottomListInfo'>Déplace les joueurs pour définir leur seed</div>
            }
          </div>
        </DndContext>


      <div className='bottomButtons is-flex is-justify-content-space-between'>
          {user.isAdmin ?
            <>
              <CustomButton callback={balanceTournament} tooltip={tournament.status == TournamentStatus.Open ? "Empêcher les joueurs d'interragir avec le tournoi, pour pouvoir les re-seeder" : "Réouvrir le tournoi aux joueurs"} contentItems={tournament.status == TournamentStatus.Open ? [StartSVG(), "Verrouiller"] : [StartSVG(), "Déverrouiller"]} colorClass='has-background-primary-level' />
              {/**  DEV ONLY  */ }
              {process.env.NODE_ENV === "development" && canAddPlayer && <CustomButton callback={addFakePlayer} contentItems={["Add player"]} colorClass='has-background-primary' />}
              {/**  DEV ONLY  */ }
            </>
            :
            <div></div>
          }
          {tournament.status == TournamentStatus.Open &&
            (tournament.players.find(player => player.username == user.username) ?
              <CustomButton callback={dontParticipate} contentItems={[LeaveSVG(), "Quitter"]} colorClass='has-background-secondary-accent' />
              :
              <CustomButton active={canAddPlayer} callback={participate} contentItems={[ParticipateSVG(), "Participer"]} colorClass='has-background-primary-accent' />
            )
          }
      </div>
    </div>
  )
}

interface TeamTileProps {
  tournament: Tournament
  team: TournamentTeam
  user: IronUser
  renameTeam: (oldTeamName: string, newTeamName: string) => void
  removeTeam: (teamName: string) => void
  removePlayersFromTeams: (players: string[]) => void
  addPlayersToTeam: (players: string[], teamName: string) => void
  isFull: boolean
  couldJoin: boolean
  draggedPlayer: string | null
  isDraggable: boolean
}
function TeamTile({ tournament, team, user, renameTeam, removeTeam, removePlayersFromTeams, addPlayersToTeam, couldJoin, isFull, draggedPlayer, isDraggable }: TeamTileProps) {
  const [showRenameTeam, setShowRenameTeam] = useState(false)
  const [showDeleteTeam, setShowDeleteTeam] = useState(false)
  const [teamName, setTeamName] = useState(team.name)
  const { isOver, setNodeRef } = useDroppable({
    id: "team_" + team.name,
  });

  return (
    <div ref={setNodeRef} className={`teamTile is-flex is-flex-direction-column ${isDraggable ? 'is-draggable' : ''}`}>
      <div className='topInfo is-flex is-align-items-center mb-1'>
        <div className='teamName is-uppercase mr-2'>{team.name}</div>
        {user.isAdmin &&
          <div className='adminOptions'>
            <div className='is-clickable is-flex is-align-content-center fade-on-mouse-out' onClick={() => setShowRenameTeam(true)}><SubsribedSVG /></div>
            <div className='is-clickable is-flex is-align-content-center fade-on-mouse-out' onClick={() => setShowDeleteTeam(true)}><BinSVG /></div>
            <CustomModalBinary
              show={showRenameTeam}
              onHide={() => setShowRenameTeam(false)}
              cancelButton={false}
              content={
                <div className='is-flex is-align-items-stretch pt-5 pl-5 pb-4'>
                  <div className="has-background-primary-accent pl-1 mt-2 mx-4"></div>
                  <div>
                    <div className='is-title medium is-uppercase mb-5 mt-1'>Renommer l&apos;équipe {team.name}</div>
                    <div className="is-flex is-align-items-center">
                      <div className="mr-3">Nom de l&apos;équipe : </div>
                      <div>
                        <input className='input' type="text" placeholder="Nom de l'équipe" value={teamName} onChange={(e) => { setTeamName(e.target.value); }} />
                      </div>
                    </div>
                  </div>
                </div>
              }
              onConfirm={() => renameTeam(team.name, teamName)}
              confirmCondition={() => teamName.toLowerCase() != "" && !(tournament.teams && tournament.teams.map(team => team.name.toLowerCase()).includes(teamName.toLowerCase()))}
            />
            <CustomModalBinary
              show={showDeleteTeam}
              onHide={() => setShowDeleteTeam(false)}
              cancelButton={true}
              content={
                <div className='is-flex is-align-items-stretch pt-5 pl-5 pb-4'>
                  <div className="has-background-primary-accent pl-1 mt-2 mx-4"></div>
                  <div>
                    <div className='is-title medium mt-1'>Es-tu sûr de vouloir supprimer l&apos;équipe {team.name} ?</div>
                  </div>
                </div>
              }
              onConfirm={() => removeTeam(team.name)}
            />
          </div>
        }
      </div>
      <div className={`membersList ${(draggedPlayer && (isFull || team.players.includes(draggedPlayer.replace('player_', '')))) ? "isFullCantDrop" : ""}`}>
        {team.players.map(player =>
          player ? <div key={player}>
            {user.isAdmin ?
              <Draggable id={'player_' + player} data={{ team: team.name }}>
                <PlayerTile playerName={player} user={user} isDraggable={true} />
              </Draggable>
              :
              <PlayerTile playerName={player} user={user} />
            }
          </div> : null
        )}
        {tournament.status == TournamentStatus.Open &&
          (team.players.includes(user.username) ?
            <div className='is-flex is-justify-content-center is-align-items-center is-unselectable px-4 py-2 is-clickable has-background-secondary-accent' onClick={() => removePlayersFromTeams([user.username])}>
              <div className=''>Quitter l&apos;équipe</div>
            </div>
            :
            (!isFull && couldJoin ?
              <div className='is-flex is-justify-content-center is-align-items-center is-unselectable px-4 py-2 is-clickable has-background-primary-accent' onClick={() => addPlayersToTeam([user.username], team.name)}>
                <div className=''>Rejoindre l&apos;équipe</div>
              </div>
              :
              null
            )
          )
        }
      </div>
    </div>
  )
}

interface OverlayTeamTileProps {
  tournament: Tournament
  teamName: string
  user: IronUser
}
function OverlayTeamTile({ tournament, teamName, user }: OverlayTeamTileProps) {
  const team = tournament.teams?.find(t => t.name == teamName)
  if (!team) return null
  return (
    <div className='teamTile is-flex is-flex-direction-column has-background-secondary-level'>
      <div className='topInfo'>
        <div className='teamName is-uppercase mr-2'>{team.name}</div>
      </div>
      <div className='membersList'>
        {team.players.map(player =>
          player ? <div key={player}>
            <PlayerTile playerName={player} user={user} />
          </div> : null
        )}
      </div>
    </div>
  )
}

interface PlayerTileProps {
  playerName: string
  user: IronUser
  isDraggable?: boolean

}

function PlayerTile({ playerName, user, isDraggable }: PlayerTileProps) {
  return (
    <div
      className={`is-flex is-clipped is-justify-content-center ${isDraggable ? "is-draggable" : ''} is-unselectable px-4 py-2 ${playerName == user.username ? 'has-background-primary-accent' : 'has-background-grey'}`}
      key={playerName}
    >{playerName}</div>
  )
}

interface PlayerWithoutTeamAreaProps {
  tournament: Tournament,
  user: IronUser,
  notInTeamPlayers: string[]
  addPlayersToTeam: (players: string[], teamName: string, awaitMutate: boolean) => void
}

function PlayerWithoutTeamArea({ tournament, notInTeamPlayers, addPlayersToTeam, user }: PlayerWithoutTeamAreaProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'no-team',
  });

  async function distributePlayers() {
    if (!tournament.teams) return
    notInTeamPlayers.forEach(player =>
      tournament.teams?.filter(team => team && team.players.length < (tournament.teamsMaxSize as number))
        .sort((teamA, teamB) => {
          const playersA = teamA?.players.length || 0;
          const playersB = teamB?.players.length || 0;
          return (playersA > playersB ? 1 : playersB > playersA ? -1 : 0)
        })[0]?.players.push(player)
    )
    const teamsCopy: TournamentTeam[] = tournament.teams.map(t => {return {name: t.name, players: t.players.slice() }})
    teamsCopy.forEach(tc => addPlayersToTeam(tc.players, tc.name, false))
    await mutate([GET_TOURNAMENT_QUERY, {id:tournament.id}])
  }
  async function balancePlayers() {
    if (!tournament.teams) return
    const meanPlayers = Math.ceil(tournament.teams.length / tournament.players.length)
    if (tournament.teams.filter(team => team && (team.players.length < meanPlayers || team.players.length > meanPlayers + 1)).length == 0) return
    tournament.teams.forEach(team => team && team.players.length > meanPlayers && notInTeamPlayers.push(...team.players.splice(meanPlayers) as string[]))
    distributePlayers()
  }
  async function randomizePlayers() {
    if (!tournament.teams) return
    tournament.teams.forEach(team => team && (team.players = [] as string[]))
    notInTeamPlayers.splice(0)
    notInTeamPlayers.push(...tournament.players.map(player => player.username).sort(() => Math.floor(Math.random() * 3) - 1))
    distributePlayers()
  }

  return (
    <>
      <div className='is-flex is-align-items-center is-justify-content-space-between'>
        <div className='is-title medium is-uppercase'>Joueurs sans équipe</div>
        <div className='is-flex'>
          {notInTeamPlayers.length > 0 ?
            <CustomButton callback={distributePlayers} tooltip='Répartir les joueurs sans équipe' contentItems={[DistributeSVG(), "Distribuer"]} customClasses='small-button px-1 ml-3' colorClass='has-background-primary-level' />
            :
            <CustomButton callback={balancePlayers} tooltip='Équilibrer les équipes' contentItems={[BalanceSVG(), "Équilibrer"]} customClasses='small-button px-1 ml-3' colorClass='has-background-primary-level' />
          }
          <CustomButton callback={randomizePlayers} tooltip='Mélanger les joueurs dans des équipes' contentItems={[RandomSVG(), "Mélanger"]} customClasses='small-button px-2 ml-3' colorClass='has-background-primary-level' />
        </div>
      </div>
      <div ref={setNodeRef} className='playersListContainer has-background-primary-level'>
        <div className='playersList p-2'>
          {notInTeamPlayers.map(player =>
            <div key={player} className='playerTileContainer'>
              <Draggable id={player} data={{ noTeam: true }}>
                <PlayerTile playerName={player} user={user} isDraggable={true} />
              </Draggable>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
