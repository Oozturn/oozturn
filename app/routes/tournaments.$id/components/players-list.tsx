import { useEffect, useState } from "react";
import { useTournament } from "~/lib/components/contexts/TournamentsContext";
import { useUser } from "~/lib/components/contexts/UserContext";
import { UserTileRectangle } from "~/lib/components/elements/user-tile";
import { Player, TournamentStatus, TournamentTeam, TournamentType } from "~/lib/types/tournaments";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { Sortable } from "~/lib/components/dnd/Sortable";
import { GetFFAMaxPlayers } from "~/lib/utils/tournaments";
import { SmartDndPointerSensor } from "~/lib/utils/smartDndPointerSensor";
import { CustomModalBinary } from "~/lib/components/elements/custom-modal";
import { CustomButton } from "~/lib/components/elements/custom-button";
import { BalanceSVG, BinSVG, DistributeSVG, RandomSVG, SubsribedSVG } from "~/lib/components/data/svg-container";
import { Draggable } from "~/lib/components/dnd/Draggable";
import { useFetcher } from "@remix-run/react";
import { TeamsManagementIntents, TournamentManagementIntents } from "../route";



export function PlayersListSolo() {

    const tournament = useTournament()
    const user = useUser()
    const fetcher = useFetcher()
    const [draggingPlayer, setDraggingPlayer] = useState<string | null>(null);
    const [sortablePlayers, setSortablePlayers] = useState<(Player & { id: string })[]>([]);

    useEffect(() => {
        setSortablePlayers(tournament.players.map(player => {
            return { ...player, id: player.userId }
        }))
    }, [tournament])

    async function onDragStart(event: DragStartEvent) {
        setDraggingPlayer(event.active.id + "")
        document.body.classList.add('is-dragging')
    }

    async function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setDraggingPlayer(null)
        document.body.classList.remove('is-dragging')
        if (over?.id && (active.id != over.id)) {
            const oldIndex = sortablePlayers.findIndex(p => String(p.userId) == active.id)
            const newIndex = sortablePlayers.findIndex(p => String(p.userId) == over.id)

            setSortablePlayers(arrayMove(sortablePlayers, oldIndex, newIndex))

            fetcher.submit(
                {
                    intent: TournamentManagementIntents.REORDER_PLAYERS,
                    tournamentId: tournament?.id || "",
                    oldIndex: oldIndex,
                    newIndex: newIndex,
                },
                { method: "POST", encType: "application/json" }
            )
        }
    }

    return (
        <div className='is-flex-col grow'>
            <DragOverlay style={{ opacity: ".75" }}>
                {draggingPlayer != null ?
                    <UserTileRectangle userId={draggingPlayer} colorClass={draggingPlayer == user.id ? 'has-background-primary-accent' : "has-background-secondary-level"} />
                    : null}
            </DragOverlay>
            <div className='is-title medium is-uppercase'>Inscrits</div>
            <DndContext
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
            >
                <div className='is-flex-col grow has-background-primary-level'>
                    <div className="no-basis is-scrollable px-3 my-3" style={{ flexGrow: 99 }}>
                        <div className='is-flex wrap gap-3'>
                            <SortableContext items={sortablePlayers} disabled={!(user.isAdmin && tournament.status == TournamentStatus.Balancing)}>
                                {sortablePlayers.map(player =>
                                    <div key={player.userId} className="grow">
                                        <Sortable id={player.userId}>
                                            <PlayerTileWithCommands userId={player.userId} isDraggable={user.isAdmin && tournament.status == TournamentStatus.Balancing} />
                                        </Sortable>
                                    </div>
                                )}
                            </SortableContext>
                            <div style={{ flexGrow: 99 }}></div>
                        </div>
                    </div>
                    {user.isAdmin && tournament.status == TournamentStatus.Balancing &&
                        <div className='bottomListInfo'>Déplace les joueurs pour définir leur seed</div>
                    }
                </div>
            </DndContext>
        </div>
    )
}

export function PlayersListTeam() {
    const tournament = useTournament()
    const user = useUser()
    const fetcher = useFetcher()
    const [showNewTeam, setShowNewTeam] = useState(false)
    const [newTeamName, setNewTeamName] = useState("")

    const [draggingPlayer, setDraggingPlayer] = useState<string | null>(null);
    const [draggingTeam, setDraggingTeam] = useState<string | null>(null);
    const [sortableTeams, setSortableTeams] = useState<(TournamentTeam & { id: string })[]>(tournament.teams?.map(team => {
        return { ...team, id: 'team_' + team.name }
    }) || []);

    useEffect(() => {
        tournament.teams && setSortableTeams(tournament.teams.map(team => {
            return { ...team, id: 'team_' + team.name }
        }))
    }, [tournament])

    const notInTeamPlayers = tournament.players.filter(player => !(tournament.teams ? tournament.teams.flatMap(team => team?.members) : [] as string[]).includes(player.userId)).map(player => player.userId)
    const canAddTeam = (tournament.settings.type == TournamentType.Duel) || (tournament.settings.type == TournamentType.FFA) && ((tournament.teams || []).length < GetFFAMaxPlayers(tournament.settings.sizes || [], tournament.settings.advancers || []))

    tournament.settings.type

    async function newTeam(team: string = newTeamName) {
        fetcher.submit(
            {
                intent: TeamsManagementIntents.CREATE,
                tournamentId: tournament?.id || "",
                teamName: team
            },
            { method: "POST", encType: "application/json" }
        )
    }
    async function addPlayerToTeam(player: string, team: string) {
        fetcher.submit(
            {
                intent: TeamsManagementIntents.ADD_PLAYER,
                tournamentId: tournament?.id || "",
                teamName: team,
                userId: player
            },
            { method: "POST", encType: "application/json" }
        )
    }
    async function removePlayerFromTeams(player: string) {
        fetcher.submit(
            {
                intent: TeamsManagementIntents.REMOVE_PLAYER,
                tournamentId: tournament?.id || "",
                userId: player
            },
            { method: "POST", encType: "application/json" }
        )
    }

    async function onDragStart(event: DragStartEvent) {
        if ((event.active.id + "").includes("team_"))
            setDraggingTeam(event.active.id + "")
        else
            setDraggingPlayer(event.active.id + "")
        document.body.classList.add('is-dragging')
    }

    async function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (draggingPlayer) {
            document.body.classList.remove('is-dragging')
            setDraggingPlayer(null)
            // Dragging on something
            const playerName = (active.id + "").replace('player_', '')
            if (over?.id && (over.id as string).startsWith('team_')) {
                over.id = (over.id as string).replace('team_', '')
                if (active.data.current && (over.id != active.data.current.team)) {
                    const targetTeam = tournament.teams?.find(t => t.name == over.id)
                    if (targetTeam && tournament.settings.teamsMaxSize && targetTeam.members.length < tournament.settings.teamsMaxSize) {
                        await removePlayerFromTeams(playerName)
                        await addPlayerToTeam(playerName, targetTeam.name)
                    }
                }
            } else {
                await removePlayerFromTeams(playerName)
            }
        } else if (draggingTeam) {
            document.body.classList.remove('is-dragging')
            setDraggingTeam(null)
            if (over?.id && (active.id != over.id)) {
                const oldIndex = sortableTeams.findIndex(t => t.id == active.id)
                const newIndex = sortableTeams.findIndex(t => t.id == over.id)

                const newTeamsOrders = arrayMove(sortableTeams, oldIndex, newIndex);
                setSortableTeams(newTeamsOrders)
                fetcher.submit(
                    {
                        intent: TournamentManagementIntents.REORDER_TEAMS,
                        tournamentId: tournament?.id || "",
                        oldIndex: oldIndex,
                        newIndex: newIndex,
                    },
                    { method: "POST", encType: "application/json" }
                )
            }
        }
    }

    const dndSensors = useSensors(useSensor(SmartDndPointerSensor, { activationConstraint: { distance: 10 } }))

    return (
        <DndContext onDragEnd={onDragEnd} onDragStart={onDragStart} sensors={dndSensors}>
            <DragOverlay style={{ opacity: ".75" }}>
                {draggingPlayer ?
                    (<UserTileRectangle userId={draggingPlayer.replace("player_", "")} colorClass={draggingPlayer.replace("player_", "") == user.id ? 'has-background-primary-accent' : "has-background-secondary-level"} />)
                    : null}
                {draggingTeam ?
                    <OverlayTeamTile team={tournament.teams?.find(team => team.name == draggingTeam.replace("team_", ""))} />
                    : null
                }
            </DragOverlay>
            <CustomModalBinary
                show={showNewTeam}
                onHide={() => setShowNewTeam(false)}
                cancelButton={false}
                content={
                    <div className='is-flex align-stretch pt-5 pl-5 pb-4'>
                        <div className="has-background-primary-accent pl-1 mt-1 mx-4"></div>
                        <div>
                            <div className='is-title medium is-uppercase mb-5'>Nouvelle équipe</div>
                            <div className="is-flex align-center">
                                <div className="mr-3">Nom de l&apos;équipe : </div>
                                <div>
                                    <input className='input' autoFocus type="text" placeholder="Nom de l'équipe" value={newTeamName} onChange={(e) => { setNewTeamName(e.target.value) }} onKeyDown={(e) => e.key == "Enter" && newTeam()} />
                                </div>
                            </div>
                        </div>
                    </div>
                }
                onConfirm={newTeam}
                confirmCondition={() => newTeamName.toLowerCase() != "" && !(tournament.teams && tournament.teams.map(team => team.name.toLowerCase()).includes(newTeamName.toLowerCase()))}
                cantConfirmTooltip={newTeamName.toLowerCase() == "" ? "Le nom d'équipe ne peut pas être vide" : "Nom d'équipe déjà utilisé"}
            />
            <div className='is-flex-col p-3 grow'>
                <div className='is-flex justify-space-between pb-2'>
                    <div className='is-title medium is-uppercase'>équipes</div>
                    {(user.isAdmin || (tournament.settings.usersCanCreateTeams && notInTeamPlayers.includes(user.id) && tournament.status == TournamentStatus.Open)) && canAddTeam &&
                        <CustomButton callback={() => setShowNewTeam(true)} tooltip='Répartir les joueurs sans équipe' contentItems={[SubsribedSVG(), "New team"]} customClasses='small-button' colorClass='has-background-primary-accent' />
                    }
                </div>
                <div className='is-flex-col grow has-background-primary-level'>
                    <div className="no-basis is-scrollable px-2 my-2" style={{ flexGrow: 99 }}>
                        <div className='is-flex wrap '>
                            <SortableContext items={sortableTeams} disabled={!user.isAdmin}>
                                {sortableTeams.map(team =>
                                    team ?
                                        <div key={team.name} className={`is-one-third p-1 ${(user.isAdmin && (tournament.status == TournamentStatus.Balancing)) ? 'is-draggable' : ''}`}>
                                            <Sortable id={'team_' + team.name}>
                                                <TeamTile
                                                    team={team}
                                                    draggedPlayer={draggingPlayer}
                                                    addPlayerToTeam={addPlayerToTeam}
                                                    removePlayerFromTeams={removePlayerFromTeams}
                                                />
                                            </Sortable>
                                        </div>
                                        : null
                                )}
                            </SortableContext>
                        </div>
                    </div>
                    {user.isAdmin && tournament.status == TournamentStatus.Balancing &&
                        <div className='bottomListInfo'>Déplace les équipes pour définir leur seed</div>
                    }
                </div>
                <PlayerWithoutTeamArea />
            </div>
        </DndContext>
    )
}


interface TeamTileProps {
    team: TournamentTeam
    draggedPlayer: string | null
    addPlayerToTeam: (player: string, teamName: string) => void
    removePlayerFromTeams: (player: string) => void
}
function TeamTile({ team, draggedPlayer, addPlayerToTeam, removePlayerFromTeams }: TeamTileProps) {
    const tournament = useTournament()
    const user = useUser()
    const fetcher = useFetcher()
    const [showRenameTeam, setShowRenameTeam] = useState(false)
    const [showDeleteTeam, setShowDeleteTeam] = useState(false)
    const [teamName, setTeamName] = useState(team.name)
    const { isOver, setNodeRef } = useDroppable({
        id: "team_" + team.name,
    });

    const isFull = !(tournament.settings.useTeams && tournament.settings.teamsMaxSize && team.members.length < tournament.settings.teamsMaxSize)
    const couldJoin = !team.members.includes(user.id)

    async function renameTeam(oldTeamName: string, newTeamName: string) {
        fetcher.submit(
            {
                intent: TeamsManagementIntents.RENAME,
                tournamentId: tournament?.id || "",
                oldTeamName: oldTeamName,
                newTeamName: newTeamName
            },
            { method: "POST", encType: "application/json" }
        )
    }
    async function removeTeam(team: string) {
        fetcher.submit(
            {
                intent: TeamsManagementIntents.DELETE,
                tournamentId: tournament?.id || "",
                teamName: team
            },
            { method: "POST", encType: "application/json" }
        )
    }

    return (
        <div ref={setNodeRef} className="is-flex-col has-background-secondary-level p-2">
            <div className='is-flex-row align-center justify-space-between'>
                <div className='is-uppercase'>{team.name}</div>
                {user.isAdmin &&
                    <div className='is-flex-row align-center gap-1'>
                        <div className='is-clickable is-flex fade-on-mouse-out' onClick={() => setShowRenameTeam(true)}><SubsribedSVG /></div>
                        <div className='is-clickable is-flex fade-on-mouse-out' onClick={() => setShowDeleteTeam(true)}><BinSVG /></div>
                        <CustomModalBinary
                            show={showRenameTeam}
                            onHide={() => setShowRenameTeam(false)}
                            cancelButton={false}
                            content={
                                <div className='is-flex align-stretch pt-5 pl-5 pb-4'>
                                    <div className="has-background-primary-accent pl-1 mt-2 mx-4"></div>
                                    <div>
                                        <div className='is-title medium is-uppercase mb-5 mt-1'>Renommer l&apos;équipe {team.name}</div>
                                        <div className="is-flex align-center">
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
                            content={`Es-tu sûr de vouloir supprimer l'équipe ${team.name} ?`}
                            cancelButton={true}
                            onConfirm={() => removeTeam(team.name)}
                        />
                    </div>
                }
            </div>
            <div className="is-flex-col gap-1" style={{ opacity: (draggedPlayer && (isFull || team.members.includes(draggedPlayer.replace('player_', '')))) ? "50%" : "100%" }}>
                {team.members.map(player =>
                    player ? <div key={player}>
                        {user.isAdmin ?
                            <Draggable id={'player_' + player} data={{ team: team.name }}>
                                <PlayerTileWithCommands userId={player} isDraggable={true} baseColor="has-background-grey" />
                            </Draggable>
                            :
                            <UserTileRectangle userId={player} />
                        }
                    </div> : null
                )}
                {tournament.status == TournamentStatus.Open &&
                    (team.members.includes(user.id) ?
                        <div className='is-flex justify-center align-center is-unselectable px-4 py-2 is-clickable has-background-secondary-accent' onClick={() => removePlayerFromTeams(user.id)}>
                            <div className=''>Quitter l&apos;équipe</div>
                        </div>
                        :
                        (!isFull && couldJoin ?
                            <div className='is-flex justify-center align-center is-unselectable px-4 py-2 is-clickable has-background-primary-accent' onClick={() => addPlayerToTeam(user.id, team.name)}>
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
    team?: TournamentTeam
}
function OverlayTeamTile({ team }: OverlayTeamTileProps) {
    if (!team) return null
    return (
        <div className='is-flex-col has-background-secondary-level p-3'>
            <div className='is-uppercase mr-2'>{team.name}</div>
            <div className='is-flex-col gap-1'>
                {team.members.map(userId =>
                    <UserTileRectangle userId={userId} />
                )}
            </div>
        </div>
    )
}

function PlayerWithoutTeamArea() {
    const tournament = useTournament()
    const user = useUser()
    const fetcher = useFetcher()

    if (!tournament.teams) return null
    const teams = tournament.teams
    const notInTeamPlayers = tournament.players.filter(player => !([] as string[]).concat(...teams.map(team => team.members)).includes(player.userId)).map(player => player.userId)
    const [hooveredPlayer, setHooveredPlayer] = useState("")

    const { isOver, setNodeRef } = useDroppable({
        id: 'no-team',
    });

    async function distributePlayers() {
        fetcher.submit(
            {
                intent: TeamsManagementIntents.DISTRIBUTE,
                tournamentId: tournament?.id || ""
            },
            { method: "POST", encType: "application/json" }
        )
    }
    async function removeUserFromTournament(userId: string) {
        fetcher.submit(
            {
                intent: TournamentManagementIntents.REMOVE_PLAYER,
                tournamentId: tournament?.id || "",
                userId: userId
            },
            { method: "POST", encType: "application/json" }
        )
    }
    async function balancePlayers() {
        fetcher.submit(
            {
                intent: TeamsManagementIntents.BALANCE,
                tournamentId: tournament?.id || ""
            },
            { method: "POST", encType: "application/json" }
        )
    }
    async function randomizePlayers() {
        fetcher.submit(
            {
                intent: TeamsManagementIntents.RANDOMIZE,
                tournamentId: tournament?.id || ""
            },
            { method: "POST", encType: "application/json" }
        )
    }

    return (
        <>
            <div className='is-flex align-center justify-space-between py-2'>
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
            <div ref={setNodeRef} className='is-flex-col grow has-background-primary-level' style={{ minHeight: '10%', maxHeight: '15%' }}>
                <div className='no-basis grow is-scrollable px-3 my-3'>
                    <div className='is-flex wrap gap-3'>
                        {notInTeamPlayers.map(player =>
                            <div key={player} className="grow">
                                <Draggable id={player} data={{ noTeam: true }}>
                                    <PlayerTileWithCommands userId={player} isDraggable={true} />
                                </Draggable>
                            </div>
                        )}
                        <div style={{ flexGrow: 99 }}></div>
                    </div>
                </div>
            </div>
        </>
    )
}

interface PlayerTileWithCommandsProps {
    userId: string
    isDraggable?: boolean
    baseColor?: string
}
function PlayerTileWithCommands({ userId, isDraggable, baseColor }: PlayerTileWithCommandsProps) {
    const [hooveredPlayer, setHooveredPlayer] = useState(false)
    const user = useUser()
    const tournament = useTournament()
    const fetcher = useFetcher()

    async function removeUserFromTournament(userId: string) {
        fetcher.submit(
            {
                intent: TournamentManagementIntents.REMOVE_PLAYER,
                tournamentId: tournament?.id || "",
                userId: userId
            },
            { method: "POST", encType: "application/json" }
        )
    }

    return <div className={`is-flex align-center grow ${isDraggable ? 'is-draggable' : ''} ${userId == user.id ? 'has-background-primary-accent' : baseColor ? baseColor : "has-background-secondary-level"}`} onMouseEnter={() => setHooveredPlayer(true)} onMouseLeave={() => setHooveredPlayer(false)}>
        <UserTileRectangle userId={userId} />
        <div className="is-flex align-center is-clickable" style={{ width: "20px" }} onClick={() => removeUserFromTournament(userId)}>
            {user.isAdmin && hooveredPlayer && <BinSVG />}
        </div>
    </div>
}