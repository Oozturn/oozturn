import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import TournamentsList from "./tournaments-list";
import { TournamentContext } from "~/lib/components/contexts/TournamentsContext";
import { Tournament } from "~/lib/types/tournaments";
import { getTournament } from "~/lib/persistence/tournaments.server";
import TournamentNotFound from "~/lib/components/tournaments/not-found";
import TournamentInfoSettings from "~/lib/components/tournaments/info-settings";
import { useUser } from "~/lib/components/contexts/UserContext";
import { CustomButton } from "~/lib/components/elements/custom-button";
import { CustomModalBinary } from "~/lib/components/elements/custom-modal";
import { useState } from "react";
import { BinSVG, LeaveSVG, ParticipateSVG, StartSVG, SubsribedSVG } from "~/lib/components/data/svg-container";
import { UserTileRectangle } from "~/lib/components/elements/user-tile";
import { addPlayerToTournament, removePlayerFromTournament } from "./queries.server";
import { useUsers } from "~/lib/components/contexts/UsersContext";

export async function loader({
    params,
}: LoaderFunctionArgs): Promise<{
    tournament: Tournament | undefined;
}> {
    return { tournament: getTournament(params.id || "") };
}

export async function action({ request }: ActionFunctionArgs) {
    const jsonData = await request.json()
    const intent = jsonData.intent as string

    switch (intent) {
        case PlayersManagementIntents.ADD_PLAYER:
            addPlayerToTournament(jsonData.tournamentId as string, jsonData.userId as string)
            break;
        case PlayersManagementIntents.REMOVE_PLAYER:
            removePlayerFromTournament(jsonData.tournamentId as string, jsonData.userId as string)
            break;
    }

    return null
}

enum PlayersManagementIntents {
    ADD_PLAYER = "addPlayer",
    REMOVE_PLAYER = "removePlayer",
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
                intent: PlayersManagementIntents.ADD_PLAYER,
                userId: user.id,
                tournamentId: tournament?.id || "",
            },
            { method: "POST", encType: "application/json" }
        )
    }
    const leaveTournament = () => {
        fetcher.submit(
            {
                intent: PlayersManagementIntents.REMOVE_PLAYER,
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
                intent: PlayersManagementIntents.ADD_PLAYER,
                userId: player.id,
                tournamentId: tournament?.id || "",
            },
            { method: "POST", encType: "application/json" }
        )
    }
    {/**  DEV ONLY  */ }

    const startTournament = () => { }

    const editTournament = () => { }

    const cancelTournament = () => { }

    return <div className="is-flex-row grow gap-3 p-0 is-full-height">
        <TournamentContext.Provider value={tournament}>
            <TournamentsList />
            <div className="is-flex-col grow gap-3">
                <div className="is-title big is-uppercase has-background-secondary-level p-2 px-4">
                    Tournoi {tournament.name}
                </div>
                <div className="has-background-secondary-level is-flex-row grow p-3 gap-6">
                    <div className="is-flex-col">
                        <TournamentInfoSettings />
                        <div className='grow'></div>
                        {user.isAdmin &&
                            <div className='bottomButtons is-flex is-justify-content-end gap-3'>
                                <CustomButton callback={editTournament} contentItems={[SubsribedSVG(), "Éditer"]} tooltip='Modifier les paramètres du tournoi' colorClass='has-background-primary-level' />
                                <CustomButton callback={() => setShowConfirmCancel(true)} contentItems={[BinSVG(), "Annuler"]} colorClass='has-background-primary-level' />
                                <CustomModalBinary show={showConfirmCancel} onHide={() => setShowConfirmCancel(false)} content={"Es-tu sûr de vouloir supprimer ce tournoi ?"} cancelButton={true} onConfirm={cancelTournament} />
                                <CustomButton callback={() => setShowConfirmStart(true)} contentItems={[StartSVG(), "Démarrer"]} colorClass='has-background-primary-accent' />
                                <CustomModalBinary show={showConfirmStart} onHide={() => setShowConfirmStart(false)} content={"Es-tu sûr de vouloir démarrer ce tournoi ?"} cancelButton={true} onConfirm={startTournament} />
                            </div>
                        }
                    </div>
                    <div className="is-flex-col grow">
                        <div className='is-title medium is-uppercase'>Joueurs inscrits</div>
                        <div className="has-background-primary-level grow">
                            <div className="is-flex wrap has-background-primary-level grow gap-3 p-3">
                                {tournament.players.map(player =>
                                    <UserTileRectangle userId={player.userId} colorClass="has-background-secondary-level" height={40} maxLength={400} />
                                )}
                            </div>
                        </div>
                        <div className="mb-3"></div>
                        <div className="is-flex-row gap-3">
                            {user.isAdmin ?
                                <>
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