import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useFetcher, useNavigate } from "@remix-run/react";
import useLocalStorageState from "use-local-storage-state";
import { useGames } from "~/lib/components/contexts/GamesContext";
import { useLan } from "~/lib/components/contexts/LanContext";
import { useTournaments } from "~/lib/components/contexts/TournamentsContext";
import { CustomButton } from "~/lib/components/elements/custom-button";
import { CustomCheckbox } from "~/lib/components/elements/custom-checkbox";
import { CustomSelect } from "~/lib/components/elements/custom-select";
import { EditGlobalTournamentPoints } from "~/lib/components/elements/global-tournament-points";
import { getLan, updateLan } from "~/lib/persistence/lan.server";
import { requireUserAdmin, requireUserLoggedIn } from "~/lib/session.server";
import { Lan } from "~/lib/types/lan";
import { autoSubmit } from "~/lib/utils/autosubmit";
import { Days, range } from "~/lib/utils/ranges";
import { AdminSectionContext, Section, useAdminSection } from "./components/AdminSectionContext";
import { PlayerList } from "./components/player-list";
import { renamePlayer, resetUserPassword } from "./queries.server";

export const meta: MetaFunction = () => {
    return [
        { title: useLan().name + " - Admin" }
    ]
}

export async function loader({ request }: LoaderFunctionArgs) {
    await requireUserAdmin(request)
    return null
}

export enum AdminIntents {
    UPDATE_LAN = "update_lan",
    END_LAN = "end_lan",

    ADD_PLAYERS = "add_players",
    // REMOVE_PLAYERS,
    RENAME_PLAYER = "rename_player",
    // MERGE_PLAYERS,
    RESET_USER_PASSWORD = "reset_user_password",

    // REMOVE_GAME,
    // ADD_GAME,
    // UPDATE_GAME,
    // UPDATE_TOURNAMENTS_DEFAULT_POINTS,

    // UPDATE_SHOW_TEMPORARY_RESULTS,
    // UPDATE_SHOW_TEAMS_RESULTS,
    // UPDATE_WEIGHT_TEAMS_RESULTS,
    // UPDATE_ACHIEVEMENTS,
}

export async function action({ request }: ActionFunctionArgs) {
    requireUserLoggedIn(request)

    const formData = await request.formData()
    const intent = formData.get("intent")
    switch (intent) {
        case AdminIntents.UPDATE_LAN:
            let partialLan: Partial<Lan> = {
                name: formData.get("lan_name") ? String(formData.get("lan_name")) : undefined,
                motd: formData.get("lan_motd") ? String(formData.get("lan_motd")) : undefined,
                startDate: formData.get("lan_start_date") ? JSON.parse(String(formData.get("lan_start_date"))) : undefined,
                endDate: formData.get("lan_end_date") ? JSON.parse(String(formData.get("lan_end_date"))) : undefined,
                newUsersByAdminOnly: formData.get("lan_newUsersByAdminOnly") ? JSON.parse(String(formData.get("lan_newUsersByAdminOnly"))) : undefined,
                authenticationNeeded: formData.get("lan_authenticationNeeded") ? JSON.parse(String(formData.get("lan_authenticationNeeded"))) : undefined,
                globalTournamentDefaultPoints: formData.get("lan_globalTournamentDefaultPoints") ? JSON.parse(String(formData.get("lan_globalTournamentDefaultPoints"))) : undefined,
                showPartialResults: formData.get("lan_showPartialResults") ? JSON.parse(String(formData.get("lan_showPartialResults"))) : undefined,
                weightTeamsResults: formData.get("lan_weightTeamsResults") ? JSON.parse(String(formData.get("lan_weightTeamsResults"))) : undefined,
                showTeamsResults: formData.get("lan_showTeamsResults") ? JSON.parse(String(formData.get("lan_showTeamsResults"))) : undefined,
            }
            Object.keys(partialLan).forEach(key => (partialLan as any)[key] === undefined && delete (partialLan as any)[key])
            updateLan(partialLan)
            break;
        case AdminIntents.RESET_USER_PASSWORD:
            await resetUserPassword(request, String(formData.get("userId")))
            break;
        case AdminIntents.RENAME_PLAYER:
            await renamePlayer(request, String(formData.get("userId")), String(formData.get("newUsername")))
            break;
        default:
            break;
    }

    return null
}

export default function Admin() {
    const fetcher = useFetcher()

    const [activeSection, setActiveSection] = useLocalStorageState<Section>("admin_activeSection", { defaultValue: "lanSettings" })

    function updateLan(key: string, value: string) {
        let fd = new FormData()
        fd.append(key, value)
        fd.append("intent", AdminIntents.UPDATE_LAN)
        fetcher.submit(fd, { method: "POST" })
    }

    return (
        <>
            <div className="is-full-height is-flex gap-3 m-0 p-3">
                <div className="is-two-thirds is-flex-col gap-3 p-0 is-full-height">
                    <AdminSectionContext.Provider value={{ setActiveSection, updateLan }}>
                        <SectionLanSettings isActive={activeSection == "lanSettings"} />
                        <SectionTournamentsSettings isActive={activeSection == "tournamentsSettings"} />
                        <SectionGlobalTournamentSettings isActive={activeSection == "globalTournamentSettings"} />
                        <SectionCommunicationSettings isActive={activeSection == "communicationSettings"} />
                    </AdminSectionContext.Provider>
                </div>

                <PlayerList />
            </div>
        </>
    )
}

export function SectionLanSettings({ isActive }: { isActive: boolean }) {
    const { setActiveSection, updateLan } = useAdminSection()
    const fetcher = useFetcher()
    const lan = useLan()

    return <div className={`is-clipped has-background-secondary-level px-4 is-flex-col ${isActive ? "grow no-basis" : ""}`}>
        <div className="is-title medium is-uppercase py-2 px-1 is-clickable" onClick={() => setActiveSection("lanSettings")}>
            Paramètres de la LAN
        </div>
        <div className="is-flex-col gap-4" style={{ maxHeight: isActive ? undefined : 0 }}>
            {/* LAN Name */}
            <fetcher.Form className="is-flex gap-3" method="POST">
                <div className='has-text-right is-one-fifth'>Nom de la LAN :</div>
                <div className="grow">
                    <input type="hidden" name="intent" value={AdminIntents.UPDATE_LAN} />
                    <input id="field"
                        name="lan_name"
                        className="input" type="text"
                        defaultValue={lan.name}
                        {...autoSubmit(fetcher)}
                    />
                </div>
            </fetcher.Form>
            {/* MOTD */}
            <fetcher.Form className="is-flex gap-3" method="POST">
                <div className='has-text-right is-one-fifth'>Mot du jour :</div>
                <div className="grow">
                    <input type="hidden" name="intent" value={AdminIntents.UPDATE_LAN} />
                    <textarea id="field"
                        name="lan_motd"
                        className="textarea"
                        style={{ resize: "none" }}
                        defaultValue={lan.motd}
                        {...autoSubmit(fetcher)}
                    />
                </div>
            </fetcher.Form>
            <div></div>  {/* Spacer */}
            {/* Start date */}
            <div className="is-flex gap-3">
                <div className='has-text-right is-one-fifth'>Début de la LAN :</div>
                <div className='is-flex grow gap-3'>
                    <CustomSelect
                        variable={lan.startDate.day}
                        setter={(v: string) => updateLan("lan_start_date", JSON.stringify({ ...lan.startDate, day: v }))}
                        items={range(0, 6, 1).map(d => { return { label: Days[d], value: d } })}
                        customClass='is-one-fifth'
                        itemsToShow={7}
                    />
                    <CustomSelect
                        variable={lan.startDate.hour}
                        setter={(v: string) => updateLan("lan_start_date", JSON.stringify({ ...lan.startDate, hour: v }))}
                        items={range(0, 23, 1).map(d => { return { label: String(d) + "h ", value: d } })}
                        itemsToShow={15}
                    />
                </div>
            </div>
            {/* End date */}
            <div className="is-flex gap-3">
                <div className='has-text-right is-one-fifth'>Fin de la LAN :</div>
                <div className='is-flex grow gap-3'>
                    <input type="hidden" name="intent" value={AdminIntents.UPDATE_LAN} />
                    <CustomSelect
                        variable={lan.endDate.day}
                        setter={(v: string) => updateLan("lan_end_date", JSON.stringify({ ...lan.endDate, day: v }))}
                        items={[...range(lan.startDate.day + 1, 6, 1), ...range(0, lan.startDate.day - 1, 1)].map(d => { return { label: Days[d], value: d } })}
                        customClass='is-one-fifth'
                    />
                    <CustomSelect
                        variable={lan.endDate.hour}
                        setter={(v: string) => updateLan("lan_end_date", JSON.stringify({ ...lan.endDate, hour: v }))}
                        items={range(0, 23, 1).map(d => { return { label: String(d) + "h ", value: d } })}
                        itemsToShow={15}
                    />
                </div>
            </div>
            <div></div>  {/* Spacer */}
            {/* User creation */}
            <div className="is-flex gap-3 align-center">
                <CustomCheckbox variable={lan.newUsersByAdminOnly} customClass='justify-flex-end is-one-fifth' setter={(value: boolean) => updateLan("lan_newUsersByAdminOnly", JSON.stringify(value))} />
                <div className='lanSubscriptiontByAdmins'>Seuls les admins peuvent inscrire les nouveaux joueurs </div>
                <CustomButton callback={() => { }} contentItems={["New players"]} colorClass="has-background-primary-level" />
            </div>
            {/* Authentication */}
            <div className="is-flex gap-3 align-center">
                <CustomCheckbox variable={lan.authenticationNeeded} customClass='justify-flex-end is-one-fifth' setter={(value: boolean) => updateLan("lan_authenticationNeeded", JSON.stringify(value))} />
                <div className='lanSubscriptiontByAdmins'>Authentification par mot de passe</div>
            </div>
            <div></div>  {/* Spacer */}
            {/* End of LAN */}
            <div className="is-flex grow justify-center">
                <CustomButton callback={() => { }} contentItems={["Terminer la LAN"]} colorClass="has-background-primary-level" />
            </div>
        </div>
    </div>
}

export function SectionTournamentsSettings({ isActive }: { isActive: boolean }) {
    const { setActiveSection } = useAdminSection()
    const navigate = useNavigate()
    const tournaments = useTournaments()
    const games = useGames()

    return <div className={`is-clipped has-background-secondary-level px-4 is-flex-col ${isActive ? "grow no-basis" : ""}`}>
        <div className="is-title medium is-uppercase py-2 px-1 is-clickable" onClick={() => setActiveSection("tournamentsSettings")} style={{ flex: "none" }}>
            Jeux et tournois
        </div>
        <div className="is-flex-col gap-4 is-scrollable" style={isActive ? { marginBottom: "1rem" } : { maxHeight: 0 }}>
            {/* LAN games */}
            {/* Si on clique gauche dessus ça ouvre l'édition du jeu.
            Si on clique droit ça ouvre un menu contextuel qui propose de mettre à jour ou supprimer le jeu.
            Tout au début de la liste se trouve le bouton d'ajout de nouveau jeu.
        */}
            <div className="is-flex gap-3 ">
                <div className="has-text-right is-one-fifth mt-4">Jeux de la LAN :</div>
                <div id="tournamentsList" className="is-flex wrap grow gap-1 p-2 has-background-primary-level is-scrollable">
                    <div className="is-flex">
                        <Link to="/admin/add-games" className="customButton fade-on-mouse-out is-unselectable grow has-background-secondary-level is-clickable">New Game
                        </Link>
                    </div>
                    {games.map(game =>
                        <div className="has-background-secondary-level p-2 grow has-text-centered" style={{ minWidth: "190px" }} key={game.id}>{game.name}</div>
                    )}
                    <div className="growmax" style={{ width: 0, margin: "-.5rem" }}></div>
                </div>
            </div>
            {/* LAN tournaments */}
            {/* Si on clique gauche dessus ça envoie au tournoi.
            Si on clique droit ça ouvre un menu contextuel qui propose de mettre à jour ou supprimer le tournoi.
            Tout au début de la liste se trouve le bouton d'ajout de nouveau tournoi.
        */}
            <div className="is-flex gap-3 ">
                <div className="has-text-right is-one-fifth mt-4">Tournois de la LAN :</div>
                <div id="tournamentsList" className="is-flex wrap grow gap-1 p-2 has-background-primary-level is-scrollable">
                    <div className="is-flex">
                        <CustomButton customClasses="grow" contentItems={["New tournament"]} colorClass="has-background-secondary-level" callback={() => { navigate("/tournaments/new") }}></CustomButton>
                    </div>
                    {tournaments.map(tournament =>
                        <CustomButton customClasses="grow" contentItems={[tournament.name]} colorClass="has-background-secondary-level" callback={() => { navigate("/tournaments/" + tournament.id) }}></CustomButton>
                        // <div className="has-background-secondary-level p-2 grow has-text-centered" style={{ minWidth: "190px" }} key={tournament.id}>{tournament.name}</div>
                    )}
                    <div className="growmax" style={{ width: 0, margin: "-.5rem" }}></div>
                </div>
            </div>
        </div>
    </div>
}

export function SectionGlobalTournamentSettings({ isActive }: { isActive: boolean }) {
    const { setActiveSection, updateLan } = useAdminSection()
    const lan = useLan()

    return <div className={`is-clipped has-background-secondary-level px-4 is-flex-col ${isActive ? "grow no-basis" : ""}`}>
        <div className="is-title medium is-uppercase py-2 px-1 is-clickable" onClick={() => setActiveSection("globalTournamentSettings")} style={{ flex: "none" }}>
            Tournoi global et résultats
        </div>
        <div className="is-flex-col gap-4" style={{ maxHeight: isActive ? undefined : 0 }}>
            <div className="is-flex gap-3">
                <div className="has-text-right is-one-fifth">Points par défaut :</div>
                <EditGlobalTournamentPoints points={lan.globalTournamentDefaultPoints} updatePoints={(pts) => updateLan("lan_globalTournamentDefaultPoints", JSON.stringify(pts))
                } />
                <div className='is-size-7 pb-3 pl-3 no-basis grow is-align-self-flex-end'>Dans ce tableau, indique le nombre de points que les joueurs recevront à chaque tournoi en fonction de leur classement.</div>
            </div>
            <div></div>  {/* Spacer */}
            <div className='is-flex gap-3'>
                <CustomCheckbox variable={lan.showPartialResults} customClass='mt-2 justify-flex-end is-one-fifth' setter={(value: boolean) => updateLan("lan_showPartialResults", JSON.stringify(value))} />
                <div className='is-flex-col'>
                    <div>Résultats provisoires</div>
                    <div className='is-size-7 no-basis grow'>En choisissant <i>oui</i>, les résultats des tournois seront calculés et mis à jour à chaque match.<br />Chaque participant aura le minimum de points possible en fonction de ses matchs terminés.</div>
                </div>
            </div>
            <div className='is-flex gap-3'>
                <CustomCheckbox variable={lan.showTeamsResults} customClass='mt-2 justify-flex-end is-one-fifth' setter={(value: boolean) => updateLan("lan_showTeamsResults", JSON.stringify(value))} />
                <div className='is-flex-col'>
                    <div>Afficher le classement par équipes</div>
                    <div className='is-size-7'>Sélectionne <i>oui</i> pour pondérer les scores d&apos;équipe en fonction du nombre de joueurs qui la composent. Dans le cas contraire, bien sûr, sélectionne <i>non</i>.</div>
                </div>
            </div>
            <div className='is-flex gap-3'>
                <CustomCheckbox variable={lan.weightTeamsResults} customClass='mt-2 justify-flex-end is-one-fifth' setter={(value: boolean) => updateLan("lan_weightTeamsResults", JSON.stringify(value))} />
                <div className='is-flex-col'>
                    <div>Classement d&apos;équipe pondéré</div>
                    <div className='is-size-7'>Sélectionne <i>oui</i> pour pondérer les scores d&apos;équipe en fonction du nombre de joueurs qui la composent. Dans le cas contraire, bien sûr, sélectionne <i>non</i>.</div>
                </div>
            </div>
            <div className='is-flex gap-3 align-center'>
                <CustomCheckbox variable={lan.showTeamsResults} customClass='justify-flex-end is-one-fifth' setter={(value: boolean) => updateLan("lan_showTeamsResults", JSON.stringify(value))} />
                <div>Afficher les achievements</div>
                {/* <div className='is-flex-col'>
                <div className='is-size-7'>Sélectionne <i>oui</i> pour pondérer les scores d&apos;équipe en fonction du nombre de joueurs qui la composent. Dans le cas contraire, bien sûr, sélectionne <i>non</i>.</div>
            </div> */}
                <CustomButton callback={() => { }} contentItems={["Edit achievements"]} colorClass="has-background-primary-level" />
            </div>
        </div>
    </div>
}

export function SectionCommunicationSettings({ isActive }: { isActive: boolean }) {
    const { setActiveSection } = useAdminSection()
    const fetcher = useFetcher()

    return <div className={`is-clipped has-background-secondary-level px-4 is-flex-col ${isActive ? "grow no-basis" : ""}`}>
        <div className="is-title medium is-uppercase py-2 px-1 is-clickable" onClick={() => setActiveSection("communicationSettings")} style={{ flex: "none" }}>
            Communication et add-ons
        </div>
        <div className="is-flex-col gap-4" style={{ maxHeight: isActive ? undefined : 0 }}>
            {/* Torrent tracker */}
            <fetcher.Form className="is-flex gap-3" method="POST">
                <div className='has-text-right is-one-fifth'>Tracker torrent :</div>
                <div className="grow">
                    <input type="hidden" name="intent" value={AdminIntents.UPDATE_LAN} />
                    <input id="field"
                        name="torrent_tracker"
                        className="input" type="text"
                        defaultValue=""
                        title="Tracker à renseigner lors de la création de torrents. Laisser vide si aucun tracker n'est disponible."
                    // {...autoSubmit(fetcher)}
                    />
                </div>
            </fetcher.Form>
            {/* TS server */}
            <fetcher.Form className="is-flex gap-3" method="POST">
                <div className='has-text-right is-one-fifth'>TS server URL :</div>
                <div className="grow">
                    <input type="hidden" name="intent" value={AdminIntents.UPDATE_LAN} />
                    <input id="field"
                        name="teamspeak_server"
                        className="input" type="text"
                        defaultValue=""
                        title="URL du serveur TS à utiliser durant la LAN. Laisser vide si aucun serveur TS n'est disponible."
                    // {...autoSubmit(fetcher)}
                    />
                </div>
            </fetcher.Form>
            {/* Notifications */}
            Notifications options...
        </div>
    </div>
}