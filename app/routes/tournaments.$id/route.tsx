import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, useRevalidator } from "@remix-run/react";
import TournamentsList from "./tournaments-list";
import { TournamentContext } from "~/lib/components/contexts/TournamentsContext";
import { Tournament, TournamentStatus } from "~/lib/types/tournaments";
import { getTournament } from "~/lib/persistence/tournaments.server";
import TournamentNotFound from "~/lib/components/tournaments/not-found";
import TournamentInfoSettings from "~/lib/components/tournaments/info-settings";
import { useUser } from "~/lib/components/contexts/UserContext";
import { CustomButton } from "~/lib/components/elements/custom-button";
import { CustomModalBinary } from "~/lib/components/elements/custom-modal";
import { useState } from "react";
import { BinSVG, LeaveSVG, ParticipateSVG, StartSVG, SubsribedSVG } from "~/lib/components/data/svg-container";
import { addPlayerToTournament, addTeamToTournament, toggleBalanceTournament, removePlayerFromTournament, reorderPlayers, reorderTeams, addPlayerToTeam, removeTeamFromTournament, renameTeam, removePlayerFromTeams, distributePlayersOnTeams, balanceTeams, randomizePlayersOnTeams } from "./queries.server";
import { useUsers } from "~/lib/components/contexts/UsersContext";
import { PlayersListSolo, PlayersListTeam } from "./players-list";

export async function loader({
    params,
}: LoaderFunctionArgs): Promise<{
    tournament: Tournament | undefined;
}> {
    let tournament: Tournament | undefined = undefined
    try {
        tournament = getTournament(params.id || "")
    } catch { }
    return { tournament: tournament };
}

export async function action({ request }: ActionFunctionArgs) {
    const jsonData = await request.json()
    const intent = jsonData.intent as string

    switch (intent) {
        case TournamentManagementIntents.BALANCE:
            toggleBalanceTournament(jsonData.tournamentId as string)
            break;
        case TournamentManagementIntents.ADD_PLAYER:
            addPlayerToTournament(jsonData.tournamentId as string, jsonData.userId as string)
            break;
        case TournamentManagementIntents.REMOVE_PLAYER:
            removePlayerFromTournament(jsonData.tournamentId as string, jsonData.userId as string)
            break;
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
            break;
        case TeamsManagementIntents.REMOVE_PLAYER:
            removePlayerFromTeams(jsonData.tournamentId as string, jsonData.userId as string)
            break;
        case TeamsManagementIntents.DISTRIBUTE:
            distributePlayersOnTeams(jsonData.tournamentId as string)
            break;
        case TeamsManagementIntents.BALANCE:
            balanceTeams(jsonData.tournamentId as string)
            break;
        case TeamsManagementIntents.RANDOMIZE:
            randomizePlayersOnTeams(jsonData.tournamentId as string)
            break;
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

export default function TournamentPage() {
    const { tournament } = useLoaderData<typeof loader>();
    const user = useUser()
    const fetcher = useFetcher()
    const users = useUsers()

    const [showConfirmStart, setShowConfirmStart] = useState(false)
    const [showConfirmCancel, setShowConfirmCancel] = useState(false)

    if (!tournament) {
        return <div className="is-flex-row grow gap-3 p-0 is-full-height">
            <TournamentsList />
            <TournamentNotFound />
        </div>
    }

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
        console.log(player)
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
        fetcher.submit(
            {
                intent: TournamentManagementIntents.EDIT,
                tournamentId: tournament?.id || "",
            },
            { method: "POST", encType: "application/json" }
        )
    }

    const cancelTournament = () => {
        fetcher.submit(
            {
                intent: TournamentManagementIntents.CANCEL,
                tournamentId: tournament?.id || "",
            },
            { method: "POST", encType: "application/json" }
        )
    }

    return <div className="is-flex-row grow gap-3 p-0 is-full-height">
        <TournamentContext.Provider value={tournament}>
            <TournamentsList />
            <div className="is-flex-col grow gap-3">
                <div className="is-title big is-uppercase has-background-secondary-level p-2 px-4">
                    Tournoi {tournament.name}
                </div>
                <div className="has-background-secondary-level is-flex-row grow p-3 gap-6">
                    <div className="is-flex-col is-one-third">
                        <TournamentInfoSettings />
                        <div className='grow'></div>
                        {user.isAdmin &&
                            <div className='is-flex justify-end gap-3'>
                                <CustomButton callback={editTournament} contentItems={[SubsribedSVG(), "Éditer"]} tooltip='Modifier les paramètres du tournoi' colorClass='has-background-primary-level' />
                                <CustomButton callback={() => setShowConfirmCancel(true)} contentItems={[BinSVG(), "Annuler"]} colorClass='has-background-primary-level' />
                                <CustomModalBinary show={showConfirmCancel} onHide={() => setShowConfirmCancel(false)} content={"Es-tu sûr de vouloir supprimer ce tournoi ?"} cancelButton={true} onConfirm={cancelTournament} />
                                <CustomButton callback={() => setShowConfirmStart(true)} contentItems={[StartSVG(), "Démarrer"]} colorClass='has-background-primary-accent' />
                                <CustomModalBinary show={showConfirmStart} onHide={() => setShowConfirmStart(false)} content={"Es-tu sûr de vouloir démarrer ce tournoi ?"} cancelButton={true} onConfirm={startTournament} />
                            </div>
                        }
                    </div>
                    <div className="is-flex-col grow no-basis">
                        {tournament.settings.useTeams ?
                            <PlayersListTeam />
                            :
                            <PlayersListSolo />
                        }
                        <div className="mb-3"></div>
                        <div className="is-flex-row justify-space-between gap-3">
                            {user.isAdmin ?
                                <>
                                    <CustomButton callback={toggleBalanceTournament} tooltip={tournament.status == TournamentStatus.Open ? "Empêcher les joueurs d'interragir avec le tournoi, pour pouvoir les re-seeder" : "Réouvrir le tournoi aux joueurs"} contentItems={tournament.status == TournamentStatus.Open ? [StartSVG(), "Verrouiller"] : [StartSVG(), "Déverrouiller"]} colorClass='has-background-primary-level' />
                                    {/**  DEV ONLY  */}
                                    {process.env.NODE_ENV === "development" && <CustomButton callback={addFakePlayer} contentItems={["Add player"]} colorClass='has-background-primary' />}
                                    {/**  DEV ONLY  */}
                                </>
                                :
                                <></>
                            }
                            {tournament.players.find(player => player.userId == user.id) ?
                                <CustomButton callback={leaveTournament} contentItems={[LeaveSVG(), "Quitter"]} colorClass='has-background-secondary-accent' />
                                :
                                <CustomButton callback={joinTournament} contentItems={[ParticipateSVG(), "Participer"]} colorClass='has-background-primary-accent' />
                            }
                        </div>
                    </div>
                </div>
            </div>
        </TournamentContext.Provider>
    </div>
}