import { useState } from "react";
import { useLan } from "../contexts/LanContext";
import { Tournament, TournamentStatus, TournamentType } from "~/lib/types/tournaments";
import { CustomSelect } from "../elements/custom-select";
import { useGames } from "../contexts/GamesContext";
import { Days, range } from "~/lib/utils/ranges";
import { DuelSVG, DuelSoloSVG, DuelTeamSVG, FFASVG, FFASoloSVG, FFATeamSVG } from "../data/svg-container";
import { CustomRadio } from "../elements/custom-radio";
import { GetFFAMaxPlayers } from "~/lib/utils/tournaments";
import { CustomButton } from "../elements/custom-button";
import { useFetcher } from "@remix-run/react";

const enum tournamentEditSteps {
    PROPERTIES,
    TYPE,
    PARAMETERS,
    COMMENTS,
}

interface TournamentEditProps {
    existingTournament?: Tournament
}
export default function TournamentEdit({ existingTournament }: TournamentEditProps) {

    const lan = useLan();
    const games = useGames();

    const [editStep, set_editStep] = useState<tournamentEditSteps>(tournamentEditSteps.PROPERTIES)

    const tId = existingTournament ? existingTournament.id : Date.now().toString()

    const [tName, set_tName] = useState(existingTournament ? existingTournament.name : "")
    const [tGame, set_tGame] = useState(existingTournament ? existingTournament.game : undefined)
    const [tGlobalTournamentPointsLeaders, set_tGlobalTournamentPointsLeaders] = useState(existingTournament ? existingTournament.settings.globalTournamentPoints.leaders : lan.globalTournamentDefaultPoints.leaders)
    const [tGlobalTournamentPointsDefault, set_tGlobalTournamentPointsDefault] = useState(existingTournament ? existingTournament.settings.globalTournamentPoints.default : lan.globalTournamentDefaultPoints.default)
    const [tStartTime, set_tStartTime] = useState(existingTournament ? existingTournament.settings.startTime : lan.startDate)
    const [tComments, set_tComments] = useState(existingTournament ? existingTournament.comments : "")

    const [tType, set_tType] = useState(existingTournament ? existingTournament.settings.type : TournamentType.Duel)
    const [tUseTeams, set_tUseTeams] = useState(existingTournament ? existingTournament.settings.useTeams : false)
    const [tInvertedScore, set_tInvertedScore] = useState(existingTournament ? existingTournament.settings.invertedScore : false)

    // Duel options
    const [tCatchUp, set_tCatchUp] = useState(existingTournament ? existingTournament.bracket.options.last : undefined)
    const [tShortBracket, set_tShortBracket] = useState(existingTournament ? existingTournament.bracket.options.short : undefined)

    // FFA options
    const [tNbRounds, set_tNbRounds] = useState(existingTournament ? existingTournament.bracket.options.sizes.length : 2)
    const [tSizes, set_tSizes] = useState(existingTournament ? existingTournament.bracket.options.sizes : [6, 6])
    const [tAdvancers, set_tAdvancers] = useState(existingTournament ? existingTournament.bracket.options.advancers : [3])
    const [tLimit, set_tLimit] = useState(existingTournament ? existingTournament.bracket.options.limit : 1)

    // Teams options
    const [tUsersCanCreateTeams, set_tUsersCanCreateTeams] = useState(existingTournament ? existingTournament.settings.usersCanCreateTeams : false)
    const [tTeamsMaxSize, set_tTeamsMaxSize] = useState(existingTournament ? existingTournament.settings.teamsMaxSize : 8)


    const fetcher = useFetcher();
    function PublishTournament() {
        let fd = new FormData()
        const tournament: Tournament = {
            id: tId,
            name: tName,
            game: tGame,
            status: TournamentStatus.Open,
            settings: {
                invertedScore: tInvertedScore,
                type: tType,
                startTime: tStartTime,
                useTeams: tUseTeams,
                globalTournamentPoints: {
                    leaders: tGlobalTournamentPointsLeaders,
                    default: tGlobalTournamentPointsDefault
                },
                usersCanCreateTeams: tUsersCanCreateTeams,
                teamsMaxSize: tTeamsMaxSize
            },
            players: [],
            bracket: {
                options: {
                    last: tCatchUp,
                    short: tShortBracket,
                    sizes: tSizes,
                    advancers: tAdvancers,
                    limit: tLimit,
                    lowerScoreIsBetter: tInvertedScore
                },
                type: tType,
            },
            comments: tComments,
        }
        fd.append("tournament", JSON.stringify(tournament))
        fetcher.submit(fd, { method: "POST" })
    }

    return (
        <div className="is-flex-col grow gap-3 p-0 is-full-height">
            <div className="is-title big is-uppercase has-background-secondary-level p-2 px-4 " onClick={() => set_editStep(tournamentEditSteps.PROPERTIES)}>
                {existingTournament ? "Édition de " + tName : "Nouveau tournoi"}
            </div>
            <div className={`is-clipped has-background-secondary-level px-4 is-flex-col ${editStep == tournamentEditSteps.PROPERTIES ? "grow no-basis" : ""}`}>
                <div className="is-title medium is-uppercase py-2 px-1" onClick={() => set_editStep(tournamentEditSteps.PROPERTIES)}>
                    Propriétés du tournoi
                </div>
                <div className="is-flex-col gap-4" style={{ maxHeight: editStep == tournamentEditSteps.PROPERTIES ? undefined : 0 }}>
                    <div className='is-flex is-align-items-center field'>
                        <div className='mr-3'>Nom du tournoi :</div>
                        <input className='input' type="text" placeholder="Nom du tournoi" value={tName} onChange={(e) => { set_tName(e.target.value); }} />
                    </div>
                    <div className='is-flex is-align-items-center field'>
                        <div className='mr-3'>Jeu :</div>
                        <CustomSelect
                            variable={tGame}
                            setter={(v: string) => set_tGame(Number(v))}
                            items={games.sort((a, b) => a.id == -1 ? -1 : b.id == -1 ? 1 : a.name < b.name ? -1 : a.name == b.name ? 0 : 1).map(game => { return { label: game.name, value: game.id } })}
                            itemsToShow={20}
                        />
                    </div>
                    <div className="mt-3 globalTournamentOptions">
                        <div className='mb-3'>Points au classement global :</div>
                        <div className='is-flex is-flex-wrap-wrap topRanksPoints pl-6'>
                            <div className='rankPoints is-flex is-flex-direction-column mr-4'>
                                <div className='rank has-text-right has-text-weight-normal'>Place :</div>
                                <div className='points has-text-right'>Points :</div>
                            </div>
                            {tGlobalTournamentPointsLeaders.map((points, index) =>
                                <div key={index} className="rankPoints is-flex is-flex-direction-column">
                                    <div className="rank is-flex is-justify-content-center is-align-items-center">{index + 1}</div>
                                    <input className="points" type="number" value={String(tGlobalTournamentPointsLeaders[index])} onChange={(e) => set_tGlobalTournamentPointsLeaders(tGlobalTournamentPointsLeaders.map((pts, idx) => idx == index ? Number(e.target.value) : tGlobalTournamentPointsLeaders[idx]))}></input>
                                </div>
                            )}
                            <div className="rankPoints is-flex is-flex-direction-column">
                                <div className="rank is-flex is-justify-content-center is-align-items-center">5 et +</div>
                                <input className="points" type="number" value={String(tGlobalTournamentPointsDefault)} onChange={(e) => set_tGlobalTournamentPointsDefault(Number(e.target.value))}></input>
                            </div>
                        </div>
                        <div className='is-size-7 mt-2 pl-6'>Dans ce tableau, indique le nombre de points que les joueurs recevront en fonction de leur classement.</div>
                    </div>
                    <div>Heure de démarrage du tournoi</div>
                    <div className='field is-flex is-align-items-start mb-5'>
                        <p className='mr-3'>Début du tournoi :</p>
                        <div className='is-flex is-flex-direction-column'>
                            <div className='is-flex is-align-items-center'>
                                <CustomSelect
                                    variable={tStartTime.day}
                                    setter={(v: string) => set_tStartTime({ ...tStartTime, day: Number(v) })}
                                    items={[...range(lan.startDate.day, 6, 1), ...range(0, lan.endDate.day, 1)].map(d => { return { label: Days[d], value: d } })}
                                    customClass='mr-3'
                                />
                                <CustomSelect
                                    variable={tStartTime.hour}
                                    setter={(v: string) => set_tStartTime({ ...tStartTime, hour: Number(v) })}
                                    items={range(tStartTime.day == lan.startDate.day ? lan.startDate.hour : 0, tStartTime.day == lan.endDate.day ? lan.endDate.hour - 1 : 23, 1).map(d => { return { label: String(d) + "h ", value: d } })}
                                    customClass='mr-1'
                                    itemsToShow={7}
                                />
                            </div>
                            <div className="is-size-7 mt-1">Cette info est indicative seulement, le tournoi sera démarré manuellement</div>
                        </div>
                    </div>
                    <div className='nextStep-button'>
                        <CustomButton
                            callback={() => set_editStep(editStep + 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={['Suivant']}
                        />
                    </div>
                </div>
            </div>

            <div className={`is-clipped has-background-secondary-level px-4 is-flex-col ${editStep == tournamentEditSteps.TYPE ? "grow no-basis" : ""}`}>
                <div className="is-title medium is-uppercase py-2 px-1 " onClick={() => { if (editStep > tournamentEditSteps.TYPE) set_editStep(tournamentEditSteps.TYPE) }}>
                    Type de tournoi
                </div>
                <div className="is-flex-col gap-4" style={{ maxHeight: editStep == tournamentEditSteps.TYPE ? undefined : 0 }}>
                    <div className='is-flex is-align-items-center is-justify-content-space-around mt-4 mb-6'>
                        <div className='is-flex is-flex-direction-column is-align-items-center'>
                            <div className={`svgSelection is-clickable ${tType == TournamentType.Duel ? 'is-active' : ''}`} onClick={() => set_tType(TournamentType.Duel)}>
                                <DuelSVG />
                            </div>
                            <div className='is-title medium my-3'>DUEL</div>
                            <div className='typeDescription is-size-7 has-text-centered'>Sélectionne le mode Duel si le jeu fait s’opposer 2 camps lors d’un duel qui fera ressortir un gagnant et un perdant.</div>
                        </div>
                        <div className='is-flex is-flex-direction-column is-align-items-center'>
                            <div className={`svgSelection is-clickable ${tType == TournamentType.FFA ? 'is-active' : ''}`} onClick={() => set_tType(TournamentType.FFA)}>
                                <FFASVG />

                            </div>
                            <div className='is-title medium my-3'>CLASSEMENT</div>
                            <div className='typeDescription is-size-7 has-text-centered'>Sélectionne le mode Classement si le jeu fait s’opposer plus de 2 camps et qu’il donne un résultat sous forme de classement.</div>
                        </div>
                    </div>

                    <div className='is-flex is-align-items-center is-justify-content-space-around mt-4 mb-4'>
                        <div className='is-flex is-flex-direction-column is-align-items-center'>
                            <div className={`svgSelection is-clickable ${tUseTeams == false ? 'is-active' : ''}`} onClick={() => set_tUseTeams(false)}>
                                {tType == TournamentType.Duel ? <DuelSoloSVG /> : <FFASoloSVG />}
                            </div>
                            <div className='is-title medium my-3'>SOLO</div>
                        </div>
                        <div className='is-flex is-flex-direction-column is-align-items-center'>
                            <div className={`svgSelection is-clickable ${tUseTeams == true ? 'is-active' : ''}`} onClick={() => set_tUseTeams(true)}>
                                {tType == TournamentType.Duel ? <DuelTeamSVG /> : <FFATeamSVG />}
                            </div>
                            <div className='is-title medium my-3'>ÉQUIPES</div>
                        </div>
                    </div>
                    <div className='is-flex is-align-items-start'>
                        <div className='mr-3'>Type de score :</div>
                        <div className='is-flex is-flex-direction-column'>
                            <CustomRadio variable={tInvertedScore} setter={set_tInvertedScore} items={[{ label: 'Score classique', value: false }, { label: 'Score inversé', value: true }]} />
                            <div className='mx-3 is-size-7'>Sélectionne <i>score classique</i> si le camp gagnant est celui qui a le plus haut score en fin de partie. Dans le cas contraire, bien sûr, sélectionne <i>Score inversé</i>.</div>
                        </div>
                    </div>
                    <div className='nextStep-button'>
                        <CustomButton
                            callback={() => set_editStep(editStep - 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={['Précédent']}
                        />
                    </div>
                    <div className='nextStep-button'>
                        <CustomButton
                            callback={() => set_editStep(editStep + 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={['Suivant']}
                        />
                    </div>
                </div>
            </div>

            <div className={`is-clipped has-background-secondary-level px-4 is-flex-col ${editStep == tournamentEditSteps.PARAMETERS ? "grow no-basis" : ""}`}>
                <div className="is-title medium is-uppercase py-2 px-1 " onClick={() => { if (editStep > tournamentEditSteps.PARAMETERS) set_editStep(tournamentEditSteps.PARAMETERS) }}>
                    Paramètres du tournoi
                </div>
                <div className="is-flex-col gap-4" style={{ maxHeight: editStep == tournamentEditSteps.PARAMETERS ? undefined : 0 }}>
                    {/* Si DUEL */}
                    {tType == TournamentType.Duel &&
                        <>
                            <div className='is-flex is-align-items-start mb-5'>
                                <div className='mr-3'>Rattrapage :</div>
                                <div className='is-flex is-flex-direction-column'>
                                    <CustomRadio variable={tCatchUp} setter={set_tCatchUp} items={[{ label: 'non', value: false }, { label: 'oui', value: true }]} />
                                    <div className='mx-3 is-size-7 longDescription'>En sélectionnant <i>non</i>, le tounois sera à élimination directe, une défaite et zou, tu dégages ! En sélectionnant <i>oui</i>, les joueurs qui perdent une première fois restent en compétition. Au prix de sang et de larmes ils pourront revenir au sommet. Mais en cas de seconde défaite prends ton flambeau, la sentance sera irrévocable.</div>
                                </div>
                            </div>
                            <div className='is-flex is-align-items-start mb-5'>
                                <div className='mr-3'>Format court :</div>
                                <div className='is-flex is-flex-direction-column'>
                                    <CustomRadio variable={tShortBracket} setter={set_tShortBracket} items={[{ label: 'non', value: false }, { label: 'oui', value: true }]} />
                                    {tCatchUp == true &&
                                        <div className='mx-3 is-size-7 longDescription'>En sélectionnant <i>oui</i>, il n&apos;y aura pas de double finale. Le gagnant du rattrapage pourra voler la victoire contre le gagnant du tableau principal en une rencontre. C&apos;est pas juste, mais c&apos;est comme ça. En sélectionnant <i>non</i>, la justice reprend le dessus et le gagnant sera alors vraiment celui ayant le moins de défaites.</div>
                                    }
                                    {tCatchUp == false &&
                                        <div className='mx-3 is-size-7 longDescription'>En sélectionnant <i>oui</i>, il n&apos;y aura pas de petite finale. Premier, second, les autres sont des perdants. En sélectionnant <i>non</i>, on connaitra le vainqueur de la médaille en chocolat.</div>
                                    }
                                    {tCatchUp == undefined &&
                                        <div className='mx-3 is-size-7 longDescription'>Sélectionne une option de rattrapage pour avoir des précisions sur ce paramètre</div>
                                    }
                                </div>
                            </div>
                        </>
                    }
                    {/* Si FFA */}
                    {tType == TournamentType.FFA &&
                        <>
                            <div className='is-flex is-align-items-center'>
                                <div className='mr-3 is-size-5'>Nombre de manches :</div>
                                <CustomSelect
                                    variable={tNbRounds}
                                    setter={(value: string) => {
                                        if (Number(value) >= 1) {
                                            set_tNbRounds(Number(value))
                                            set_tSizes(Array.from(Array(Number(value)), (_, i) => tSizes[i] || 6))
                                            set_tAdvancers(Array.from(Array(Number(value) - 1), (_, i) => tAdvancers[i] || 3))
                                        }
                                    }}
                                    items={range(1, 10, 1).map(d => { return { label: String(d), value: d } })}
                                    itemsToShow={6}
                                />
                            </div>
                            <div className='is-flex ffa-sequence my-2 is-align-items-stretch'>
                                <div className='is-size-5 mt-4'>Déroulement du tournoi :</div>
                                <div className='is-flex is-flex-direction-column is-align-items-stretch mt-0 mr-3'>
                                    <div className='ffa-round-name is-align-items-start is-justify-content-start'></div>
                                    <div className='ffa-round-nb-select my-1 is-justify-content-end is-align-items-center'>{tUseTeams == true ? "Équipes" : tUseTeams == false ? "Joueurs" : "Opposants"} max par match :</div>
                                    <div className='ffa-round-nb-select my-1 is-justify-content-end is-align-items-center ml-4'>Qualifiés pour la manche suivante :</div>
                                    <div className='ffa-max-players is-justify-content-end mt-2'>Nombre {tUseTeams == true ? "d'équipes" : tUseTeams == false ? "de joueurs" : "d'opposants"} max dans le tournoi :</div>
                                </div>
                                <div className='is-flex is-flex-direction-column'>
                                    <div className='is-flex'>
                                        {tSizes.map((_, i) =>
                                            <div key={i} className='is-flex is-flex-direction-column is-align-items-center mr-3'>
                                                <div className='ffa-round-name'>Manche {i + 1}</div>
                                                <CustomSelect
                                                    variable={tSizes[i]}
                                                    setter={(v: string) =>
                                                        set_tSizes(tSizes.slice(0, i).concat([Number(v)], tSizes.slice(i + 1)))
                                                    }
                                                    items={range(i == 0 ? 2 : tAdvancers[i - 1] > 2 ? tAdvancers[i - 1] : 2, i == 0 ? 128 : tAdvancers[i - 1] * 5, i == 0 ? 1 : tAdvancers[i - 1]).map(d => { return { label: String(d), value: d } })}
                                                    customClass='ffa_nb_round_select mt-1'
                                                    itemsToShow={6}
                                                />
                                                {i < tNbRounds - 1 ?
                                                    <CustomSelect
                                                        variable={tAdvancers[i]}
                                                        setter={(v: string) =>
                                                            set_tAdvancers(tAdvancers.slice(0, i).concat([Number(v)], tAdvancers.slice(i + 1)))
                                                        }
                                                        items={range(1, tSizes[i], 1).map(d => { return { label: String(d), value: d } })}
                                                        customClass='ffa_nb_round_select mt-2'
                                                        itemsToShow={6}
                                                    />
                                                    :
                                                    <div className='ffa-round-nb-select my-1'></div>
                                                }
                                            </div>
                                        )}
                                    </div>
                                    <div className='ffa-max-players is-justify-content-start mt-3'>{GetFFAMaxPlayers(tSizes, tAdvancers)}</div>
                                </div>
                            </div>
                        </>
                    }
                    {/* Si team */}
                    {tUseTeams &&
                        <>
                            <div className='is-flex is-align-items-center field mb-4 is-size-6'>
                                <div className='mr-3 is-size-5'>Nombre de joueurs par équipe :</div>
                                <CustomSelect
                                    variable={tTeamsMaxSize}
                                    setter={(v: string) => set_tTeamsMaxSize(Number(v))}
                                    items={range(2, 64, 1).map(d => { return { label: String(d), value: d } })}
                                    itemsToShow={4}
                                    showOnTop={true}
                                />
                            </div>
                            <div className='is-flex is-align-items-center is-size-6'>
                                <div className='mr-3 is-size-5'>Les joueurs peuvent créer des équipes :</div>
                                <div className='is-flex is-flex-direction-column'>
                                    <CustomRadio variable={tUsersCanCreateTeams} setter={set_tUsersCanCreateTeams} items={[{ label: 'non', value: false }, { label: 'oui', value: true }]} />
                                </div>
                            </div>
                        </>
                    }
                    <div className='nextStep-button'>
                        <CustomButton
                            callback={() => set_editStep(editStep - 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={['Précédent']}
                        />
                    </div>
                    <div className='nextStep-button'>
                        <CustomButton
                            callback={() => set_editStep(editStep + 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={['Suivant']}
                        />
                    </div>
                </div>
            </div>

            <div className={`is-clipped has-background-secondary-level px-4 is-flex-col ${editStep == tournamentEditSteps.COMMENTS ? "grow no-basis" : ""}`}>
                <div className="is-title medium is-uppercase py-2 px-1 ">
                    Commentaires
                </div>
                <div className="is-flex-col gap-4" style={{ maxHeight: editStep == tournamentEditSteps.COMMENTS ? undefined : 0 }}>
                    <div className='is-flex is-align-items-start'>
                        <p className='mr-3'>Commentaires :</p>
                        <div className='is-flex is-flex-direction-column is-flex-grow-1'>
                            <textarea placeholder="Commentaires" value={tComments} onChange={(e) => { set_tComments(e.target.value); }} rows={8} />
                            <div className='longDescription is-size-7'>Dans cette zone tu peux ajouter d’autres informations utiles pour le tournoi comme par exemple des règles, l’emplacement du jeu, ou les identifiants pour le serveur.</div>
                        </div>
                    </div>
                    <div className='nextStep-button'>
                        <CustomButton
                            callback={() => set_editStep(editStep - 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={['Précédent']}
                        />
                    </div>
                    <div className='nextStep-button'>
                        <CustomButton
                            callback={PublishTournament}
                            colorClass='has-background-primary-accent'
                            contentItems={['Publier']}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
