import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node"
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react"
import { getTournament } from "~/lib/persistence/tournaments.server"
import TournamentInfoSettings from "./components/tournament-info-settings"
import { useUser } from "~/lib/components/contexts/UserContext"
import { CustomButton, SquareButton } from "~/lib/components/elements/custom-button"
import { CustomModalBinary } from "~/lib/components/elements/custom-modal"
import { ReactNode, useState } from "react"
import { BinSVG, LeaveSVG, LockSVG, MoreSVG, ParticipateSVG, RollBackSVG, StartSVG, SubsribedSVG, UnlockSVG } from "~/lib/components/data/svg-container"
import { addPlayerToTournament, addTeamToTournament, toggleBalanceTournament, removePlayerFromTournament, reorderPlayers, reorderTeams, addPlayerToTeam, removeTeamFromTournament, renameTeam, removePlayerFromTeams, distributePlayersOnTeams, balanceTeams, randomizePlayersOnTeams, cancelTournament, startTournament, scoreMatch, stopTournament } from "./tournament.queries.server"
import { useUsers } from "~/lib/components/contexts/UsersContext"
import { OpponentsListSolo, OpponentsListTeam } from "./components/players-list"
import { GetFFAMaxPlayers } from "~/lib/utils/tournaments"
import { BracketType, TournamentFullData, TournamentStatus } from "~/lib/tournamentEngine/types"
import { TournamentContext, useTournament } from "~/lib/components/contexts/TournamentsContext"
import { TournamentViewer } from "./components/tournamentViewer"
import { getLan } from "~/lib/persistence/lan.server"
import Dropdown from "~/lib/components/elements/custom-dropdown"
import { useRevalidateOnTournamentUpdate } from "~/api/sse.hook"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    return [
        { title: data?.lanName + " - Tournoi " + data?.tournament.properties.name }
    ]
}

export async function loader({
    params,
}: LoaderFunctionArgs): Promise<{
    tournament: TournamentFullData
    lanName: string
}> {
    let tournament: TournamentFullData | undefined = undefined
    try {
        tournament = getTournament(params.id || "").getFullData()

    } catch { throw redirect('/tournaments/404') }
    return { tournament: tournament, lanName: getLan().name }
}

export async function action({ request }: ActionFunctionArgs) {
    const jsonData = await request.json()
    const intent = jsonData.intent as string

    switch (intent) {
        case TournamentManagementIntents.START:
            startTournament(jsonData.tournamentId as string)
            break
        case TournamentManagementIntents.STOP:
            stopTournament(jsonData.tournamentId as string)
            break
        case TournamentManagementIntents.CANCEL:
            cancelTournament(jsonData.tournamentId as string)
            break
        case TournamentManagementIntents.BALANCE:
            toggleBalanceTournament(jsonData.tournamentId as string)
            break
        case TournamentManagementIntents.ADD_PLAYER:
            addPlayerToTournament(jsonData.tournamentId as string, jsonData.userId as string)
            break
        case TournamentManagementIntents.REMOVE_PLAYER:
            removePlayerFromTournament(jsonData.tournamentId as string, jsonData.userId as string)
            break
        case TournamentManagementIntents.REORDER_PLAYERS:
            reorderPlayers(jsonData.tournamentId as string, jsonData.oldIndex as number, jsonData.newIndex as number)
            break
        case TournamentManagementIntents.REORDER_TEAMS:
            reorderTeams(jsonData.tournamentId as string, jsonData.oldIndex as number, jsonData.newIndex as number)
            break
        case TeamsManagementIntents.CREATE:
            addTeamToTournament(jsonData.tournamentId as string, jsonData.teamName as string)
            break
        case TeamsManagementIntents.DELETE:
            removeTeamFromTournament(jsonData.tournamentId as string, jsonData.teamName as string)
            break
        case TeamsManagementIntents.RENAME:
            renameTeam(jsonData.tournamentId as string, jsonData.oldTeamName as string, jsonData.newTeamName as string)
            break
        case TeamsManagementIntents.ADD_PLAYER:
            addPlayerToTeam(jsonData.tournamentId as string, jsonData.teamName as string, jsonData.userId as string)
            break
        case TeamsManagementIntents.REMOVE_PLAYER:
            removePlayerFromTeams(jsonData.tournamentId as string, jsonData.userId as string)
            break
        case TeamsManagementIntents.DISTRIBUTE:
            distributePlayersOnTeams(jsonData.tournamentId as string)
            break
        case TeamsManagementIntents.BALANCE:
            balanceTeams(jsonData.tournamentId as string)
            break
        case TeamsManagementIntents.RANDOMIZE:
            randomizePlayersOnTeams(jsonData.tournamentId as string)
            break
        case MatchesIntents.SCORE:
            scoreMatch(jsonData.tournamentId as string, jsonData.matchID as string, jsonData.opponent as string, jsonData.score as number)
    }

    return null
}

export enum TournamentManagementIntents {
    START = "startTournament",
    STOP = "stopTournament",
    BALANCE = "toggleBalanceTournament",
    EDIT = "editTournament",
    CANCEL = "cancelTournament",
    ADD_PLAYER = "addPlayerToTournament",
    REMOVE_PLAYER = "removePlayerFromTournament",
    REORDER_PLAYERS = "reorderPlayers",
    REORDER_TEAMS = "reorderTeams"
}
export enum TeamsManagementIntents {
    CREATE = "createTeam",
    DELETE = "deleteTeam",
    RENAME = "renameTeam",
    ADD_PLAYER = "addPlayerToTeam",
    REMOVE_PLAYER = "removePlayerFromTeam",
    DISTRIBUTE = "distributePlayers",
    BALANCE = "balanceTeams",
    RANDOMIZE = "randomizePlayers",
}
export enum MatchesIntents {
    SCORE = "score",
}

export default function TournamentPage() {
    const { tournament } = useLoaderData<typeof loader>()

    useRevalidateOnTournamentUpdate(tournament.id)
    const user = useUser()
    const fetcher = useFetcher()
    const users = useUsers()


    const canAddPlayers = tournament.settings[0].type == BracketType.Duel || (tournament.players.length < GetFFAMaxPlayers(tournament.settings[0].sizes || [], tournament.settings[0].advancers || []) * (tournament.settings[0].useTeams ? tournament.settings[0].teamsMaxSize || 1 : 1))

    const joinTournament = () => {
        fetcher.submit(
            {
                intent: TournamentManagementIntents.ADD_PLAYER,
                userId: user.id,
                tournamentId: tournament?.id || "",
            },
            { method: "POST", encType: "application/json" }
        )
    }
    const leaveTournament = () => {
        fetcher.submit(
            {
                intent: TournamentManagementIntents.REMOVE_PLAYER,
                userId: user.id,
                tournamentId: tournament?.id || "",
            },
            { method: "POST", encType: "application/json" }
        )
    }
    {/**  DEV ONLY  */ }
    const addFakePlayer = () => {
        const notInTournament = users.filter(u => !tournament.players.map(p => p.userId).includes(u.id))
        const player = notInTournament.sort(() => Math.floor(Math.random() * notInTournament.length))[0]
        fetcher.submit(
            {
                intent: TournamentManagementIntents.ADD_PLAYER,
                userId: player.id,
                tournamentId: tournament?.id || "",
            },
            { method: "POST", encType: "application/json" }
        )
    }
    {/**  DEV ONLY  */ }

    const toggleBalanceTournament = () => {
        fetcher.submit(
            {
                intent: TournamentManagementIntents.BALANCE,
                tournamentId: tournament?.id || "",
            },
            { method: "POST", encType: "application/json" }
        )
    }

    return <div className="is-flex-row grow gap-3 p-0 is-full-height">
        <TournamentContext.Provider value={tournament}>
            <div className="is-flex-col grow gap-3">
                <div className="is-title big is-uppercase has-background-secondary-level p-2 px-4">
                    Tournoi {tournament.properties.name}
                </div>
                <div className="has-background-secondary-level is-flex-row grow p-3 gap-6 is-relative">
                    <div className="is-flex-col justify-space-between" style={{ width: "30%", minWidth: "30%", maxWidth: "30%" }}>
                        <TournamentInfoSettings />
                        {user.isAdmin && tournament.status != TournamentStatus.Done && <TournamentCommands />}
                    </div>
                    {[TournamentStatus.Open, TournamentStatus.Balancing].includes(tournament.status) ?
                        <div className="is-flex-col grow no-basis">
                            {tournament.settings[0].useTeams ?
                                <OpponentsListTeam />
                                :
                                <OpponentsListSolo />
                            }
                            <div className="mb-3"></div>
                            <div className="is-flex-row justify-space-between gap-3">
                                {user.isAdmin ?
                                    <>
                                        <CustomButton
                                            callback={toggleBalanceTournament}
                                            tooltip={tournament.status == TournamentStatus.Open ? "Empêcher les joueurs d'interragir avec le tournoi, pour pouvoir les re-seeder" : "Réouvrir le tournoi aux joueurs"}
                                            contentItems={[tournament.status == TournamentStatus.Open ? LockSVG() : UnlockSVG(), "Inscriptions"]}
                                            colorClass='has-background-primary-level' />
                                        {/**  DEV ONLY  */}
                                        {process.env.NODE_ENV === "development" && canAddPlayers && <CustomButton callback={addFakePlayer} contentItems={["Add player"]} colorClass='has-background-primary' />}
                                        {/**  DEV ONLY  */}
                                    </>
                                    :
                                    <></>
                                }
                                <>
                                    <div></div>
                                    {tournament.players.find(player => player.userId == user.id) ?
                                        <CustomButton callback={leaveTournament} contentItems={[LeaveSVG(), "Quitter"]} colorClass='has-background-secondary-accent' />
                                        :
                                        <CustomButton callback={joinTournament} active={canAddPlayers} contentItems={[ParticipateSVG(), "Participer"]} colorClass='has-background-primary-accent' />
                                    }
                                </>
                            </div>
                        </div>
                        :
                        <TournamentViewer />
                    }
                </div>
            </div>
        </TournamentContext.Provider>
    </div>
}

function TournamentCommands() {
    const tournament = useTournament()
    const user = useUser()
    const fetcher = useFetcher()
    const navigate = useNavigate()

    const [showConfirmStart, setShowConfirmStart] = useState(false)
    const [showConfirmStop, setShowConfirmStop] = useState(false)
    const [showConfirmCancel, setShowConfirmCancel] = useState(false)

    if (!user.isAdmin) return null

    const startTournament = () => {
        fetcher.submit(
            {
                intent: TournamentManagementIntents.START,
                tournamentId: tournament?.id || "",
            },
            { method: "POST", encType: "application/json" }
        )
    }

    const stopTournament = () => {
        fetcher.submit(
            {
                intent: TournamentManagementIntents.STOP,
                tournamentId: tournament?.id || "",
            },
            { method: "POST", encType: "application/json" }
        )
    }

    const editTournament = () => {
        navigate(`/tournaments/edit/${tournament.id}`)
    }

    const cancelTournament = () => {
        fetcher.submit(
            {
                intent: TournamentManagementIntents.CANCEL,
                tournamentId: tournament?.id || "",
            },
            { method: "POST", encType: "application/json" }
        )
        navigate("/")
    }
    const items: { content: ReactNode[], callback: CallableFunction }[] = []
    if (![TournamentStatus.Done, TournamentStatus.Validating].includes(tournament.status))
        items.push({ content: [SubsribedSVG(), "Éditer"], callback: editTournament })
    if ([TournamentStatus.Open, TournamentStatus.Balancing].includes(tournament.status))
        items.push({ content: [BinSVG(), "Annuler"], callback: () => setShowConfirmCancel(true) })
    if (![TournamentStatus.Open, TournamentStatus.Balancing, TournamentStatus.Done].includes(tournament.status))
        items.push({ content: [RollBackSVG(), "Redémarrer"], callback: () => setShowConfirmStop(true) })

    return <div className='is-flex justify-end gap-3'>
        {[TournamentStatus.Open, TournamentStatus.Balancing].includes(tournament.status) && <CustomButton callback={() => setShowConfirmStart(true)} contentItems={[StartSVG(), "Démarrer"]} colorClass='has-background-primary-accent' />}
        <Dropdown
            trigger={[TournamentStatus.Open, TournamentStatus.Balancing].includes(tournament.status) ?
                <SquareButton contentItems={[MoreSVG()]} colorClass='has-background-primary-level' /> :
                <CustomButton contentItems={["Options"]} colorClass='has-background-primary-level' />
            }
            id="tournamentMoreCommands"
            items={items}
            align="right"
            direction="top"
        />

        <CustomModalBinary show={showConfirmCancel} onHide={() => setShowConfirmCancel(false)} content={"Es-tu sûr de vouloir annuler ce tournoi ?"} cancelButton={true} onConfirm={cancelTournament} />
        <CustomModalBinary show={showConfirmStart} onHide={() => setShowConfirmStart(false)} content={<>Es-tu sûr de vouloir démarrer ce tournoi ? <br/>{tournament.settings[0].useTeams ? "Les équipes vides et les joueurs sans équipes seront retirés du tournoi." : ""}</>} cancelButton={true} onConfirm={startTournament} />
        <CustomModalBinary show={showConfirmStop} onHide={() => setShowConfirmStop(false)} content={`Es-tu sûr de vouloir redémarrer ce tournoi ? Tu pourras éditer ${tournament.settings[0].useTeams ? "les équipes et " : ""}les inscriptions, mais toute sa progression sera perdue !`} cancelButton={true} onConfirm={stopTournament} />
    </div>
}