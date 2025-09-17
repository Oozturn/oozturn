import { json, ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node"
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react"
import { getTournament } from "~/lib/persistence/tournaments.server"
import TournamentInfoSettings from "./components/tournament-info-settings"
import { useUser } from "~/lib/components/contexts/UserContext"
import { CustomButton, SquareButton } from "~/lib/components/elements/custom-button"
import { CustomModal, CustomModalBinary } from "~/lib/components/elements/custom-modal"
import { ReactNode, useRef, useState } from "react"
import { BinSVG, ForfeitSVG, LeaveSVG, LockSVG, MoreSVG, ParticipateSVG, RollBackSVG, StartSVG, SubsribedSVG, ThumbUpSVG, UnlockSVG } from "~/lib/components/data/svg-container"
import { addPlayerToTournament, addTeamToTournament, toggleBalanceTournament, removePlayerFromTournament, reorderPlayers, reorderTeams, addPlayerToTeam, removeTeamFromTournament, renameTeam, removePlayerFromTeams, distributePlayersOnTeams, balanceTeams, randomizePlayersOnTeams, cancelTournament, startTournament, scoreMatch, stopTournament, toggleForfeitPlayerForTournament, validateTournament, togglePauseTournament } from "./tournament.queries.server"
import { useUsers } from "~/lib/components/contexts/UsersContext"
import { OpponentsListSolo, OpponentsListTeam, TournamentInfoPlayers } from "./components/players-list"
import { GetFFAMaxPlayers } from "~/lib/utils/tournaments"
import { BracketType, TournamentFullData, TournamentStatus } from "~/lib/tournamentEngine/types"
import { TournamentContext, useTournament } from "~/lib/components/contexts/TournamentsContext"
import { TournamentViewer } from "./components/tournamentViewer"
import { getLan } from "~/lib/persistence/lan.server"
import Dropdown from "~/lib/components/elements/custom-dropdown"
import { useRevalidateOnTournamentUpdate } from "~/api/sse.hook"
import useLocalStorageState from "use-local-storage-state"
import { EventServerError } from "~/lib/emitter.server"
import { getUserFromRequest, getUserId } from "~/lib/session.server"
import { User } from "~/lib/types/user"
import { UserTileRectangle } from "~/lib/components/elements/user-tile"
import { clickorkey } from "~/lib/utils/clickorkey"
import { Trans, useTranslation } from "react-i18next"

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
    try {
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
            case TournamentManagementIntents.VALIDATE:
                validateTournament(jsonData.tournamentId as string)
                break
            case TournamentManagementIntents.PAUSE:
                togglePauseTournament(jsonData.tournamentId as string)
                break
            case TournamentManagementIntents.BALANCE:
                toggleBalanceTournament(jsonData.tournamentId as string)
                break
            case TournamentManagementIntents.ADD_PLAYER:
                addPlayerToTournament(jsonData.tournamentId as string, jsonData.userId as string)
                break
            case TournamentManagementIntents.ADD_PLAYERS:
                (jsonData.userIds as string[]).forEach(uid =>
                    addPlayerToTournament(jsonData.tournamentId as string, uid)
                )
                break
            case TournamentManagementIntents.TOGGLE_FORFEIT_PLAYER:
                toggleForfeitPlayerForTournament(jsonData.tournamentId as string, jsonData.userId as string)
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
                scoreMatch(jsonData.tournamentId as string, jsonData.matchID as string, jsonData.opponent as string, jsonData.score as number | null, await getUserFromRequest(request) as User)
                return json({ error: null, type: MatchesIntents.SCORE, matchID: jsonData.matchID as string, opponent: jsonData.opponent as string })
            default:
                break
        }
    } catch (error) {
        const userId = await getUserId(request) as string
        EventServerError(userId, intent + ": " + error as string)
        if (intent == MatchesIntents.SCORE) {
            return json({ error: "Error while scoring match", type: MatchesIntents.SCORE, matchID: jsonData.matchID as string, opponent: jsonData.opponent as string })
        }
    }
    return json({ error: null })
}

export enum TournamentManagementIntents {
    START = "startTournament",
    STOP = "stopTournament",
    BALANCE = "toggleBalanceTournament",
    EDIT = "editTournament",
    CANCEL = "cancelTournament",
    VALIDATE = "validateTournament",
    PAUSE = "togglePauseTournament",
    ADD_PLAYER = "addPlayerToTournament",
    ADD_PLAYERS = "addPlayersToTournament",
    TOGGLE_FORFEIT_PLAYER = "toggleForfeitPlayerForTournament",
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
    const [tournamentWideView,] = useLocalStorageState<string[]>("tournamentWideView", { defaultValue: [] })
    const { t } = useTranslation()


    useRevalidateOnTournamentUpdate(tournament.id)
    const user = useUser()
    const fetcher = useFetcher()
    const users = useUsers()


    const canAddPlayers = function () {
        if (tournament.bracketsCount == 2) return true
        if (tournament.bracketSettings[0].type != BracketType.FFA) return true
        const maxPlayers = GetFFAMaxPlayers(tournament.bracketSettings[0].sizes || [], tournament.bracketSettings[0].advancers || [])
        if (tournament.players.length < maxPlayers * (tournament.settings.useTeams ? tournament.settings.teamsMaxSize || 1 : 1)) return true
        return false
    }()

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
                    {t("tournoi.tournoi_nom", { tournamentName: tournament.properties.name })}
                </div>
                <div className="has-background-secondary-level is-flex-row grow p-3 gap-6">
                    {!tournamentWideView.includes(tournament.id) && <div className="is-flex-col is-relative gap-2" style={{ width: "30%", minWidth: "30%", maxWidth: "30%" }}>
                        <TournamentInfoSettings />
                        <TournamentInfoPlayers />
                        {user.isAdmin && tournament.status != TournamentStatus.Done && <TournamentCommands />}
                    </div>}
                    {[TournamentStatus.Open, TournamentStatus.Balancing].includes(tournament.status) ?
                        <div className="is-flex-col grow no-basis">
                            {tournament.settings.useTeams ?
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
                                            tooltip={tournament.status == TournamentStatus.Open ? t("bouton_tooltips.lock_inscriptions") : t("bouton_tooltips.unlock_inscriptions")}
                                            contentItems={[tournament.status == TournamentStatus.Open ? LockSVG() : UnlockSVG(), t("boutons.lock_inscriptions")]}
                                            colorClass='has-background-primary-level' />
                                        {canAddPlayers && <PlayersSelector />}
                                        {/**  DEV ONLY  */}
                                        {process.env.NODE_ENV === "development" && canAddPlayers && <CustomButton tooltip={t("bouton_tooltips.ajouter_joueur")} callback={addFakePlayer} contentItems={[t("boutons.ajouter_joueur")]} colorClass='has-background-primary' />}
                                        {/**  DEV ONLY  */}
                                    </>
                                    :
                                    <></>
                                }
                                <>
                                    <div></div>
                                    {tournament.players.find(player => player.userId == user.id) ?
                                        <CustomButton callback={leaveTournament} contentItems={[LeaveSVG(), t("boutons.quitter")]} colorClass='has-background-secondary-accent' />
                                        :
                                        <CustomButton callback={joinTournament} active={canAddPlayers} contentItems={[ParticipateSVG(), t("boutons.participer")]} colorClass='has-background-primary-accent' />
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


function PlayersSelector() {
    const { t } = useTranslation()
    const { tournament } = useLoaderData<typeof loader>()
    const fetcher = useFetcher()
    const [showAddPlayers, setShowAddPlayers] = useState(false)
    const users = useUsers()
    const [playersList, setPlayersList] = useState<{ id: string, name: string, checked: boolean }[]>([])

    const isFFA = tournament.bracketSettings[0].type == BracketType.FFA
    const availablePlaces = function () {
        if (isFFA) return Infinity
        const maxPlayers = GetFFAMaxPlayers(tournament.bracketSettings[0].sizes || [], tournament.bracketSettings[0].advancers || [])
        return (maxPlayers * (tournament.settings.useTeams ? tournament.settings.teamsMaxSize || 1 : 1) - tournament.players.length)
    }()

    function showModal() {
        setPlayersList(users.filter(u => !tournament.players.map(p => p.userId).includes(u.id)).map(u => { return { id: u.id, name: u.username, checked: false } }))
        setShowAddPlayers(true)
    }

    function togglePlayer(id: string) {
        const pList = playersList.slice()
        const player = playersList.find(p => p.id == id)
        if (player) {
            player.checked = !player.checked
            if (!isFFA || pList.filter(p => p.checked).length <= availablePlaces) {
                setPlayersList(pList)
            }
        }
    }

    const addPlayers = () => {
        fetcher.submit(
            {
                intent: TournamentManagementIntents.ADD_PLAYERS,
                userIds: playersList.filter(p => p.checked).map(p => p.id),
                tournamentId: tournament?.id || "",
            },
            { method: "POST", encType: "application/json" }
        )
    }

    return <><CustomButton tooltip={t("bouton_tooltips.ajouter_joueurs")} callback={showModal} contentItems={[t("boutons.ajouter_joueurs")]} colorClass="has-background-primary-level" />
        <CustomModalBinary
            show={showAddPlayers}
            onHide={() => setShowAddPlayers(false)}
            content={
                <div className="grow is-flex-col align-stretch p-1" style={{ maxHeight: "60vh" }}>
                    <div className="mb-3">{t("popups.selectionne_joueurs")}</div>
                    <div className="is-flex wrap gap-3 is-scrollable has-background-primary-level p-2">
                        {playersList.map(player =>
                            <div key={player.id}
                                {...clickorkey(() => togglePlayer(player.id))}
                                className={`grow is-clickable p-0 pr-2 has-background-${player.checked ? "secondary-accent" : "secondary-level"} is-flex-row align-center`}
                            >
                                <UserTileRectangle userId={player.id} />
                            </div>
                        )}
                        <div style={{ flexGrow: 99 }}></div>
                    </div>
                </div>
            }
            cancelButton={true}
            onConfirm={addPlayers}
        />
    </>
}

function TournamentCommands() {
    const tournament = useTournament()
    const user = useUser()
    const fetcher = useFetcher()
    const navigate = useNavigate()
    const { t } = useTranslation()

    const [showConfirmStart, setShowConfirmStart] = useState(false)
    const [showConfirmStop, setShowConfirmStop] = useState(false)
    const [showConfirmCancel, setShowConfirmCancel] = useState(false)
    const [showConfirmValidate, setShowConfirmValidate] = useState(false)
    const [showConfirmForfeit, setShowConfirmForfeit] = useState(false)

    const isForfeit = !!tournament.players.find(player => player.userId == user.id)?.isForfeit
    const showFFbutton = ![TournamentStatus.Open, TournamentStatus.Balancing, TournamentStatus.Validating, TournamentStatus.Done].includes(tournament.status) && tournament.players.find(player => player.userId == user.id) && !isForfeit
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

    const validateTournament = () => {
        fetcher.submit(
            {
                intent: TournamentManagementIntents.VALIDATE,
                tournamentId: tournament?.id || "",
            },
            { method: "POST", encType: "application/json" }
        )
    }

    const togglePause = () => {
        fetcher.submit(
            {
                intent: TournamentManagementIntents.PAUSE,
                tournamentId: tournament?.id || "",
                userId: user.id,
            },
            { method: "POST", encType: "application/json" }
        )
    }

    const forfeit = () => {
        fetcher.submit(
            {
                intent: TournamentManagementIntents.TOGGLE_FORFEIT_PLAYER,
                tournamentId: tournament?.id || "",
                userId: user.id,
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
        items.push({ content: [SubsribedSVG(), t("boutons.editer")], callback: editTournament })
    if ([TournamentStatus.Open, TournamentStatus.Balancing].includes(tournament.status))
        items.push({ content: [BinSVG(), t("boutons.annuler")], callback: () => setShowConfirmCancel(true) })
    if (![TournamentStatus.Open, TournamentStatus.Balancing, TournamentStatus.Done].includes(tournament.status))
        items.push({ content: [RollBackSVG(), t("boutons.redemarrer")], callback: () => setShowConfirmStop(true) })
    if ([TournamentStatus.Running, TournamentStatus.Paused].includes(tournament.status) && showFFbutton)
        items.push({ content: tournament.status == TournamentStatus.Running ? [LockSVG(), t("boutons.verrouiller")] : [StartSVG(), t("boutons.deverrouiller")], callback: togglePause })

    return <div className='is-flex justify-end gap-3'>
        {showFFbutton && <>
            <CustomButton callback={() => setShowConfirmForfeit(true)} contentItems={[ForfeitSVG(), t("boutons.abandonner")]} colorClass='has-background-primary-accent' />
            <CustomModalBinary show={showConfirmForfeit} onHide={() => setShowConfirmForfeit(false)} content={t("popups.abandonner")} cancelButton={true} onConfirm={forfeit} />
        </>}
        {user.isAdmin && <>
            {[TournamentStatus.Open, TournamentStatus.Balancing].includes(tournament.status) && <CustomButton callback={() => setShowConfirmStart(true)} contentItems={[StartSVG(), t("boutons.demarrer")]} colorClass='has-background-primary-accent' />}
            {[TournamentStatus.Validating].includes(tournament.status) && <CustomButton callback={() => setShowConfirmValidate(true)} contentItems={[ThumbUpSVG(), t("boutons.valider")]} colorClass='has-background-primary-accent' />}
            {[TournamentStatus.Running, TournamentStatus.Paused].includes(tournament.status) && !showFFbutton && <CustomButton callback={togglePause} contentItems={tournament.status == TournamentStatus.Running ? [LockSVG(), t("boutons.verrouiller")] : [StartSVG(), t("boutons.deverrouiller")]} colorClass='has-background-primary-accent' />}
            <Dropdown
                trigger={
                    <SquareButton contentItems={[MoreSVG()]} colorClass='has-background-primary-level' />}
                id="tournamentMoreCommands"
                items={items}
                align="right"
                direction="top"
            />
            <CustomModalBinary show={showConfirmCancel} onHide={() => setShowConfirmCancel(false)} content={t("popups.annuler_tournoi")} cancelButton={true} onConfirm={cancelTournament} />
            <CustomModalBinary show={showConfirmStart} onHide={() => setShowConfirmStart(false)} content={<>{t("popups.demarrer_tournoi")} {tournament.settings.useTeams ? <><br />{t("popups.demarrer_tournoi_equipes_vides")}</> : ""}</>} cancelButton={true} onConfirm={startTournament} />
            <CustomModalBinary show={showConfirmStop} onHide={() => setShowConfirmStop(false)} content={<Trans i18nKey="popups.redemarrer_tournoi" />} cancelButton={true} onConfirm={stopTournament} />
            <CustomModalBinary show={showConfirmValidate} onHide={() => setShowConfirmValidate(false)} content={tournament.bracketsCount == 2 ? <Trans i18nKey="popups.valider_phase" /> : <Trans i18nKey="popups.valider_tournoi" />} cancelButton={true} onConfirm={validateTournament} />
        </>}
    </div>
}