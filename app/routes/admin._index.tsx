import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { MetaFunction, redirect, useFetcher } from "@remix-run/react";
import { useContext, useState } from "react";
import { LanContext } from "~/lib/components/contexts/LanContext";
import { TournamentsContext } from "~/lib/components/contexts/TournamentsContext";
import { UsersContext } from "~/lib/components/contexts/UsersContext";
import { CustomButton } from "~/lib/components/elements/custom-button";
import { CustomRadio } from "~/lib/components/elements/custom-radio";
import { CustomSelect } from "~/lib/components/elements/custom-select";
import { UserAvatar } from "~/lib/components/elements/user-avatar";
import { updateLan } from "~/lib/persistence/lan.server";
import { requireUserAdmin, requireUserLoggedIn } from "~/lib/session.server";
import { autoSubmit } from "~/lib/utils/autosubmit";
import { Days, range } from "~/lib/utils/ranges";

export const meta: MetaFunction = () => {
    return [
        { title: "Admin" },
    ];
};

export async function loader({ request }: LoaderFunctionArgs) {
    await requireUserLoggedIn(request)
    await requireUserAdmin(request)
    return null
}

export async function action({ request }: ActionFunctionArgs) {
    requireUserLoggedIn(request)

    const body = await request.formData()
    console.log("edit lan")
    updateLan({
        name: String(body.get("lan_name")),
        motd: String(body.get("lan_motd"))
    })

    return null
}

export default function Admin() {

    const lan = useContext(LanContext)
    const users = useContext(UsersContext)
    const tournaments = useContext(TournamentsContext)
    const fetcher = useFetcher();

    const [activePlayer, setActivePlayer] = useState("")


    async function setStartDateDay(value: number) { }
    async function setStartDateHour(value: number) { }
    async function setEndDateDay(value: number) { }
    async function setEndDateHour(value: number) { }

    async function updateTopRanks(value: string, index: number) { }

    async function updateDefault(value: string) { }

    async function updateWeightTeamsResults(value: boolean) { }

    async function updatepartialResults(value: boolean) { }

    async function applyLanMutation(updateObject: any) { }

    const leaderboard: any[] = []

    if (!lan) {
        return null
    }

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
                                <fetcher.Form method="POST">
                                    <p className="control lanName">
                                        <input id="field"
                                            name="lan_name"
                                            className="input" type="text"
                                            defaultValue={lan.name}
                                            {...autoSubmit(fetcher)}
                                        />
                                    </p>
                                    <div className='lanDate is-flex'>
                                        <CustomSelect
                                            variable={lan.startDate.day}
                                            setter={(v: string) => setStartDateDay(Number(v))}
                                            items={range(0, 6, 1).map(d => { return { label: Days[d], value: d } })}
                                            customClass='mr-3'
                                            itemsToShow={7}
                                        />
                                        <CustomSelect
                                            variable={lan.startDate.hour}
                                            setter={(v: string) => setStartDateHour(Number(v))}
                                            items={range(0, 23, 1).map(d => { return { label: String(d) + "h ", value: d } })}
                                            itemsToShow={15}
                                        />
                                    </div>
                                    <div className='lanDate is-flex'>
                                        <CustomSelect
                                            variable={lan.endDate.day}
                                            setter={(v: string) => setEndDateDay(Number(v))}
                                            items={[...range(lan.startDate.day + 1, 6, 1), ...range(0, lan.startDate.day - 1, 1)].map(d => { return { label: Days[d], value: d } })}
                                            customClass='mr-3'
                                        />
                                        <CustomSelect
                                            variable={lan.endDate.hour}
                                            setter={(v: string) => setEndDateHour(Number(v))}
                                            items={range(0, 23, 1).map(d => { return { label: String(d) + "h ", value: d } })}
                                            customClass='mr-3'
                                            itemsToShow={15}
                                        />
                                    </div>
                                    <p className="control lanMotd">
                                        <textarea id="field"
                                            name="lan_motd"
                                            className="textarea"
                                            defaultValue={lan.motd}
                                            {...autoSubmit(fetcher)} />
                                    </p>
                                </fetcher.Form>
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
                                    callback={() => redirect("/managegames")}
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
                                        {lan.options.globalTournamentDefaultSettings.leaders.map((points, index) =>
                                            <div key={index} className="rankPoints is-flex is-flex-direction-column">
                                                <div className="rank is-flex is-justify-content-center is-align-items-center">{index + 1}</div>
                                                <input className="points" type="text" placeholder={String(points)} value={String(points)} onChange={(e) => updateTopRanks(e.target.value, index)}></input>
                                            </div>
                                        )}
                                        <div className="rankPoints is-flex is-flex-direction-column">
                                            <div className="rank is-flex is-justify-content-center is-align-items-center">5 et +</div>
                                            <input className="points" type="text" placeholder={String(lan.options.globalTournamentDefaultSettings.default)} value={String(lan.options.globalTournamentDefaultSettings.default)} onChange={(e) => updateDefault(e.target.value)}></input>
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
                                    <CustomRadio variable={lan.options.weightTeamsResults} setter={updateWeightTeamsResults} items={[{ label: 'non', value: false }, { label: 'oui', value: true }]} />
                                    <div className='mx-3 is-size-7'>Sélectionne <i>oui</i> pour pondérer les scores d&apos;équipe en fonction du nombre de joueurs qui la composent. Dans le cas contraire, bien sûr, sélectionne <i>non</i>.</div>
                                </div>
                            </div>
                        </div>
                        <div className="globalTournamentOptions mt-5 ml-6">
                            <div className='is-flex is-align-items-start'>
                                <div className='mr-1'>Résultats provisoires :</div>
                                <div className='is-flex is-flex-direction-column'>
                                    <CustomRadio variable={lan.options.partialResults} setter={updatepartialResults} items={[{ label: 'non', value: false }, { label: 'oui', value: true }]} />
                                    <div className='mx-3 is-size-7'>En choisissant <i>oui</i>, les résultats des tournois seront calculés et mis à jour à chaque match. Chaque participant aura le minimum de points possible en fonction de ses matchs terminés.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="flat-box has-background-secondary-level adminPlayersList is-full-height is-flex is-flex-direction-column pr-2">
                    <div className="is-title medium mb-2">Joueurs</div>
                    <div className="playerTilesContainer is-flex is-flex-direction-column p-0 m-0 is-scrollable pr-2">
                        {users && users.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase())).map(user =>
                            user ?
                                <div key={user.username} className={`playerTile is-flex is-flex-direction-column ${activePlayer == user.username ? 'is-active' : ''}`}>
                                    <div className='is-flex is-align-items-center is-unselectable is-clickable' onClick={() => setActivePlayer(activePlayer == user.username ? '' : user.username)}>
                                        <div className='avatar mr-3'>
                                            <UserAvatar username={user.username} avatar={user.avatar} />
                                        </div>
                                        {user.team && <div className='team fade-text mr-3'>[{user.team}]</div>}
                                        <div className='username'>{user.username}</div>
                                    </div>
                                    <div className='playerTooltip is-flex pl-3'>
                                        <div className='is-flex is-flex-direction-column'>
                                            <div>IP: {user.ips ? user.ips[0] : 'unknown'}</div>
                                            <div>Tournois: {tournaments?.filter(tournament => tournament.players.find(player => player.playername == user.username)).length || 0}</div>
                                            <div>Points: {leaderboard?.find(pscore => pscore.player.username == user.username)?.points || 0}</div>
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