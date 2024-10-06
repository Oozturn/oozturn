import { useState } from "react"
import { Days, range } from "~/lib/utils/ranges"
import { GetFFAMaxPlayers } from "~/lib/utils/tournaments"
import { useFetcher } from "@remix-run/react"
import { Duel } from "~/lib/tournamentEngine/tournament/duel"
import { BracketSettings, BracketType, TournamentFullData, TournamentProperties } from "~/lib/tournamentEngine/types"
import { globalTournamentPoints } from "~/lib/types/lan"
import { clickorkey } from "~/lib/utils/clickorkey"
import { useLan } from "~/lib/components/contexts/LanContext"
import { useGames } from "~/lib/components/contexts/GamesContext"
import { CustomSelect } from "~/lib/components/elements/custom-select"
import { EditGlobalTournamentPoints } from "~/lib/components/elements/global-tournament-points"
import { CustomButton } from "~/lib/components/elements/custom-button"
import { DuelSoloSVG, DuelSVG, DuelTeamSVG, FFASoloSVG, FFASVG, FFATeamSVG } from "~/lib/components/data/svg-container"
import { CustomRadio } from "~/lib/components/elements/custom-radio"

const enum tournamentEditSteps {
    PROPERTIES,
    TYPE,
    PARAMETERS,
    COMMENTS,
}

export function useStateMonitored<T>(defaultValue: T): [value: T, setValue: (newValue: T) => void, modified: boolean] {
    const [value, _setValue] = useState(defaultValue)
    const initialValue = defaultValue
    const [modified, setModified] = useState(false)
    const setValue = (v: T) => {
        if (v != value) _setValue(v)
        setModified(initialValue != v)
    }
    return [value, setValue, modified]
}

interface TournamentEditProps {
    existingTournament?: TournamentFullData
}
export default function TournamentEdit({ existingTournament }: TournamentEditProps) {

    const lan = useLan()
    const games = useGames()

    const [editStep, set_editStep] = useState<tournamentEditSteps>(tournamentEditSteps.PROPERTIES)

    const tId = existingTournament ? existingTournament.id : Date.now().toString()

    const [tName, set_tName, modified_tName] = useStateMonitored(existingTournament ? existingTournament.properties.name : "")
    const [tGame, set_tGame, modified_tGame] = useStateMonitored(existingTournament ? existingTournament.properties.game : undefined)
    const [tGlobalTournamentPoints, set_tGlobalTournamentPoints, modified_tGlobalTournamentPoints] = useStateMonitored<globalTournamentPoints>(existingTournament ? { leaders: existingTournament.properties.globalTournamentPoints.leaders.slice(), default: existingTournament.properties.globalTournamentPoints.default } : lan.globalTournamentDefaultPoints)
    const [tStartTime, set_tStartTime, modified_tStartTime] = useStateMonitored(existingTournament ? existingTournament.properties.startTime : lan.startDate)
    const [tComments, set_tComments, modified_tComments] = useStateMonitored(existingTournament ? existingTournament.properties.comments : "")

    const [tType, set_tType, modified_tType] = useStateMonitored(existingTournament ? existingTournament.bracketSettings[0].type : BracketType.Duel)
    const [tUseTeams, set_tUseTeams, modified_tUseTeams] = useStateMonitored(existingTournament ? existingTournament.bracketSettings[0].useTeams : false)
    const [tLowerScoreIsBetter, set_tLowerScoreIsBetter, modified_tLowerScoreIsBetter] = useStateMonitored(existingTournament ? existingTournament.bracketSettings[0].lowerScoreIsBetter : false)

    // Duel options
    const [tLast, set_tLast, modified_tLast] = useStateMonitored(existingTournament ? existingTournament.bracketSettings[0].last : undefined)
    const [tShortBracket, set_tShortBracket, modified_tShortBracket] = useStateMonitored(existingTournament ? existingTournament.bracketSettings[0].short : undefined)

    // FFA options
    const [tNbRounds, set_tNbRounds] = useState(existingTournament ? existingTournament.bracketSettings[0].sizes?.length || 2 : 2)
    const [tSizes, set_tSizes, modified_tSizes] = useStateMonitored(existingTournament ? existingTournament.bracketSettings[0].sizes || [6, 6] : [6, 6])
    const [tAdvancers, set_tAdvancers, modified_tAdvancers] = useStateMonitored(existingTournament ? existingTournament.bracketSettings[0].advancers || [3] : [3])
    const [tLimit, , modified_tLimit] = useStateMonitored(existingTournament ? existingTournament.bracketSettings[0].limit : 1)

    // GroupStage options
    const [tGroupSize, set_groupSize, modified_groupSize] = useStateMonitored(existingTournament ? existingTournament.settings[0].groupSize || 4 : 4)
    const [tWinPoints, set_winPoints, modified_winPoints] = useStateMonitored(existingTournament ? existingTournament.settings[0].winPoints || 3 : 3)
    const [tTiePoints, set_tiePoints, modified_tiePoints] = useStateMonitored(existingTournament ? existingTournament.settings[0].tiePoints || 1 : 1)
    const [tScoresBreak, , modified_scoresBreak] = useStateMonitored(existingTournament ? existingTournament.settings[0].scoresBreak || true : true)
    const [tMeetTwice, , modified_meetTwice] = useStateMonitored(existingTournament ? existingTournament.settings[0].meetTwice || false : false)

    // Teams options
    const [tUsersCanCreateTeams, set_tUsersCanCreateTeams, modified_tUsersCanCreateTeams] = useStateMonitored(existingTournament ? existingTournament.bracketSettings[0].usersCanCreateTeams : false)
    const [tTeamsMaxSize, set_tTeamsMaxSize, modified_tTeamsMaxSize] = useStateMonitored(existingTournament ? existingTournament.bracketSettings[0].teamsMaxSize : 8)


    const fetcher = useFetcher()
    function PublishTournament() {
        const id: string = tId
        const properties: TournamentProperties = {
            name: tName,
            game: tGame,
            startTime: tStartTime,
            globalTournamentPoints: tGlobalTournamentPoints,
            comments: tComments,
        }
        const settings: BracketSettings = {
            // Common
            type: tType,
            useTeams: tUseTeams,
            usersCanCreateTeams: tUsersCanCreateTeams,
            teamsMaxSize: tTeamsMaxSize,
            lowerScoreIsBetter: tLowerScoreIsBetter,
            // Duel
            short: tShortBracket,
            last: tLast,
            // FFA
            limit: tLimit,
            sizes: tSizes,
            advancers: tAdvancers,
            // GroupStage
            groupSize: tGroupSize,
            winPoints: tWinPoints,
            tiePoints: tTiePoints,
            scoresBreak: tScoresBreak,
            meetTwice: tMeetTwice,
        }
        fetcher.submit(
            {
                tournamentId: id,
                tournamentProperties: JSON.stringify(properties),
                tournamentSettings: JSON.stringify([settings])
            },
            { method: "POST", encType: "application/json" }
        )
    }
    function UpdateTournament() {
        if (!existingTournament) return
        const partialProperties: Partial<TournamentProperties> = {
            name: modified_tName ? tName : undefined,
            game: modified_tGame ? tGame : undefined,
            startTime: modified_tStartTime ? tStartTime : undefined,
            globalTournamentPoints: modified_tGlobalTournamentPoints ? tGlobalTournamentPoints : undefined,
            comments: modified_tComments ? tComments : undefined
        }
        const partialSettings: Partial<BracketSettings> = {
            type: modified_tType ? tType : undefined,
            useTeams: modified_tUseTeams ? tUseTeams : undefined,
            usersCanCreateTeams: modified_tUsersCanCreateTeams ? tUsersCanCreateTeams : undefined,
            teamsMaxSize: modified_tTeamsMaxSize ? tTeamsMaxSize : undefined,
            lowerScoreIsBetter: modified_tLowerScoreIsBetter ? tLowerScoreIsBetter : undefined,
            last: modified_tLast ? tLast : undefined,
            short: modified_tShortBracket ? tShortBracket : undefined,
            sizes: modified_tSizes ? tSizes : undefined,
            advancers: modified_tAdvancers ? tAdvancers : undefined,
            limit: modified_tLimit ? tLimit : undefined,
            groupSize: modified_groupSize ? tGroupSize : undefined,
            winPoints: modified_winPoints ? tWinPoints : undefined,
            tiePoints: modified_tiePoints ? tTiePoints : undefined,
            scoresBreak: modified_scoresBreak ? tScoresBreak : undefined,
            meetTwice: modified_meetTwice ? tMeetTwice : undefined,
        }
        fetcher.submit(
            {
                tournamentId: tId,
                tournamentProperties: JSON.stringify(partialProperties),
                tournamentSettings: JSON.stringify(partialSettings)
            },
            { method: "POST", encType: "application/json" }
        )
    }

    return (
        <div className="is-flex-col grow gap-3 p-0 is-full-height">
            <div className="is-title big is-uppercase has-background-secondary-level p-2 px-4" {...clickorkey(() => set_editStep(tournamentEditSteps.PROPERTIES))}>
                {existingTournament ? "Édition de " + tName : "Nouveau tournoi"}
            </div>
            <div className={`is-clipped has-background-secondary-level is-flex-col ${editStep == tournamentEditSteps.PROPERTIES ? "grow no-basis" : ""}`}>
                <div className={`is-title medium is-uppercase py-2 px-4 ${editStep > tournamentEditSteps.PROPERTIES ? "is-clickable" : ""}`} {...clickorkey(() => set_editStep(tournamentEditSteps.PROPERTIES))}>
                    Propriétés du tournoi
                </div>
                <div className="is-flex-col gap-5 grow px-4" style={{ maxHeight: editStep == tournamentEditSteps.PROPERTIES ? undefined : 0 }}>
                    <div className='is-flex align-center gap-3'>
                        <div className='has-text-right is-one-fifth'>Nom du tournoi :</div>
                        <input className='input is-one-quarter' type="text" placeholder="Nom du tournoi" value={tName} onChange={(e) => { set_tName(e.target.value); }} />
                    </div>
                    <div className='is-flex align-center gap-3'>
                        <div className='has-text-right is-one-fifth'>Jeu :</div>
                        <CustomSelect
                            variable={tGame}
                            setter={(v: string) => set_tGame(Number(v))}
                            items={games.sort((a, b) => a.id == -1 ? -1 : b.id == -1 ? 1 : a.name < b.name ? -1 : a.name == b.name ? 0 : 1).map(game => { return { label: game.name, value: game.id } })}
                            itemsToShow={20}
                            customClass="is-one-quarter"
                        />
                    </div>
                    <div className="is-flex gap-3">
                        <div className='has-text-right is-one-fifth'>Points au classement global :</div>
                        <div className="is-flex-col gap-2">
                            <EditGlobalTournamentPoints points={tGlobalTournamentPoints} updatePoints={set_tGlobalTournamentPoints} />
                            <div className='is-size-7 no-basis grow is-align-self-flex-end'>Dans ce tableau, indique le nombre de points que les joueurs recevront en fonction de leur classement.</div>
                        </div>
                    </div>
                    <div className='is-flex gap-3'>
                        <p className='has-text-right is-one-fifth'>Début du tournoi :</p>
                        <div className="is-flex-col gap-2">
                            <div className='is-flex align-center gap-3'>
                                <CustomSelect
                                    variable={tStartTime.day}
                                    setter={(v: string) => set_tStartTime({ ...tStartTime, day: Number(v) })}
                                    items={[...range(lan.startDate.day, 6, 1), ...range(0, lan.endDate.day, 1)].map(d => { return { label: Days[d], value: d } })}
                                />
                                <CustomSelect
                                    variable={tStartTime.hour}
                                    setter={(v: string) => set_tStartTime({ ...tStartTime, hour: Number(v) })}
                                    items={range(tStartTime.day == lan.startDate.day ? lan.startDate.hour : 0, tStartTime.day == lan.endDate.day ? lan.endDate.hour - 1 : 23, 1).map(d => { return { label: String(d) + "h ", value: d } })}
                                    customClass='mr-1'
                                    itemsToShow={7}
                                />
                            </div>
                            <div className="is-size-7 no-basis grow is-align-self-flex-end">Cette info est indicative seulement, le tournoi sera démarré manuellement</div>
                        </div>
                    </div>
                    <div className='is-flex grow align-end justify-end pb-4'>
                        <CustomButton
                            callback={() => set_editStep(editStep + 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={['Suivant']}
                        />
                    </div>
                </div>
            </div>

            <div className={`is-clipped has-background-secondary-level is-flex-col ${editStep == tournamentEditSteps.TYPE ? "grow no-basis" : ""}`}>
                <div className={`is-title medium is-uppercase py-2 px-4 ${editStep > tournamentEditSteps.TYPE ? "is-clickable" : ""}`} {...clickorkey(() => { if (editStep > tournamentEditSteps.TYPE) set_editStep(tournamentEditSteps.TYPE) })}>
                    Type de tournoi
                </div>
                <div className="is-flex-col gap-6 grow is-scrollable px-4" style={{ maxHeight: editStep == tournamentEditSteps.TYPE ? undefined : 0 }}>
                    <div className='is-flex gap-3'>
                        {/* <div className='has-text-right is-one-fifth'>Type de match :</div> */}
                        <div className='is-flex-col align-center gap-1 grow no-basis'>
                            <div className={`svgSelection is-clickable ${tType == BracketType.Duel ? 'is-active' : ''}`} {...clickorkey(() => set_tType(BracketType.Duel))}>
                                <DuelSVG />
                            </div>
                            <div className='is-title medium'>DUEL</div>
                            <div className='px-4 is-size-7 has-text-centered'>Sélectionne le mode Duel si le jeu fait s’opposer 2 camps lors d’un duel qui fera ressortir un gagnant et un perdant.</div>
                        </div>
                        <div className='is-flex-col align-center gap-1 grow no-basis'>
                            <div className={`svgSelection is-clickable ${tType == BracketType.FFA ? 'is-active' : ''}`} {...clickorkey(() => set_tType(BracketType.FFA))}>
                                <FFASVG />

                            </div>
                            <div className='is-title medium'>CLASSEMENT</div>
                            <div className='px-4 is-size-7 has-text-centered'>Sélectionne le mode Classement si le jeu fait s’opposer plus de 2 camps et qu’il donne un résultat sous forme de classement.</div>
                        </div>
                        <div className='is-flex-col align-center gap-1 grow no-basis'>
                            <div className={`svgSelection is-clickable ${tType == BracketType.GroupStage ? 'is-active' : ''}`} {...clickorkey(() => set_tType(BracketType.GroupStage))}>
                                <DuelSVG />
                            </div>
                            <div className='is-title medium'>GroupStage</div>
                            <div className='px-4 is-size-7 has-text-centered'>Round robin mode.</div>
                        </div>
                    </div>

                    <div className='is-flex gap-3'>
                        {/* <div className='has-text-right is-one-fifth'>Type d’opposants :</div> */}
                        <div className='is-flex-col align-center gap-1 grow no-basis'>
                            <div className={`svgSelection is-clickable ${tUseTeams == false ? 'is-active' : ''}`} {...clickorkey(() => set_tUseTeams(false))}>
                                {tType == BracketType.Duel ? <DuelSoloSVG /> : <FFASoloSVG />}
                            </div>
                            <div className='is-title medium'>SOLO</div>
                        </div>
                        <div className='is-flex-col align-center gap-1 grow no-basis'>
                            <div className={`svgSelection is-clickable ${tUseTeams == true ? 'is-active' : ''}`} {...clickorkey(() => set_tUseTeams(true))}>
                                {tType == BracketType.Duel ? <DuelTeamSVG /> : <FFATeamSVG />}
                            </div>
                            <div className='is-title medium'>ÉQUIPES</div>
                        </div>
                    </div>
                    <div className='is-flex grow align-end justify-space-between pb-4'>
                        <CustomButton
                            callback={() => set_editStep(editStep - 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={['Précédent']}
                        />
                        <CustomButton
                            callback={() => set_editStep(editStep + 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={['Suivant']}
                        />
                    </div>
                </div>
            </div>

            <div className={`is-clipped has-background-secondary-level is-flex-col ${editStep == tournamentEditSteps.PARAMETERS ? "grow no-basis" : ""}`}>
                <div className={`is-title medium is-uppercase py-2 px-4 ${editStep > tournamentEditSteps.PARAMETERS ? "is-clickable" : ""}`} {...clickorkey(() => { if (editStep > tournamentEditSteps.PARAMETERS) set_editStep(tournamentEditSteps.PARAMETERS) })}>
                    Paramètres du tournoi
                </div>
                <div className="is-flex-col gap-5 grow px-4" style={{ maxHeight: editStep == tournamentEditSteps.PARAMETERS ? undefined : 0 }}>
                    <div className='is-flex'>
                        <div className='has-text-right is-one-fifth'>Type de score :</div>
                        <div className='is-flex-col'>
                            <CustomRadio variable={tLowerScoreIsBetter} setter={set_tLowerScoreIsBetter} items={[{ label: 'Score classique', value: false }, { label: 'Score inversé', value: true }]} />
                            <div className='mx-3 is-size-7'>Sélectionne <i>score classique</i> si le camp gagnant est celui qui a le plus haut score en fin de partie. Dans le cas contraire, bien sûr, sélectionne <i>Score inversé</i>.</div>
                        </div>
                    </div>
                    {/* Si DUEL */}
                    {tType == BracketType.Duel &&
                        <>
                            <div className='is-flex'>
                                <div className='has-text-right is-one-fifth'>Rattrapage :</div>
                                <div className='is-flex-col no-basis grow'>
                                    <CustomRadio variable={tLast} setter={set_tLast} items={[{ label: 'non', value: Duel.WB }, { label: 'oui', value: Duel.LB }]} />
                                    <div className='mx-3 is-size-7'>En sélectionnant <i>non</i>, le tounois sera à élimination directe, une défaite et zou, tu dégages ! En sélectionnant <i>oui</i>, les joueurs qui perdent une première fois restent en compétition. Au prix de sang et de larmes ils pourront revenir au sommet. Mais en cas de seconde défaite prends ton flambeau, la sentance sera irrévocable.</div>
                                </div>
                            </div>
                            <div className='is-flex'>
                                <div className='has-text-right is-one-fifth'>Format court :</div>
                                <div className='is-flex-col no-basis grow'>
                                    <CustomRadio variable={tShortBracket} setter={set_tShortBracket} items={[{ label: 'non', value: false }, { label: 'oui', value: true }]} />
                                    {tLast == Duel.LB &&
                                        <div className='mx-3 is-size-7'>En sélectionnant <i>oui</i>, il n&apos;y aura pas de double finale. Le gagnant du rattrapage pourra voler la victoire contre le gagnant du tableau principal en une rencontre. C&apos;est pas juste, mais c&apos;est comme ça. En sélectionnant <i>non</i>, la justice reprend le dessus et le gagnant sera alors vraiment celui ayant le moins de défaites.</div>
                                    }
                                    {tLast == Duel.WB &&
                                        <div className='mx-3 is-size-7'>En sélectionnant <i>oui</i>, il n&apos;y aura pas de petite finale. Premier, second, les autres sont des perdants. En sélectionnant <i>non</i>, on connaitra le vainqueur de la médaille en chocolat.</div>
                                    }
                                    {tLast == undefined &&
                                        <div className='mx-3 is-size-7'>Sélectionne une option de rattrapage pour avoir des précisions sur ce paramètre</div>
                                    }
                                </div>
                            </div>
                        </>
                    }
                    {/* Si FFA */}
                    {tType == BracketType.FFA &&
                        <>
                            <div className='is-flex gap-3'>
                                <div className='has-text-right is-one-fifth'>Nombre de manches :</div>
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
                            <div className='is-flex gap-5'>
                                <div className='has-text-right is-one-fifth'>Déroulement du tournoi :</div>
                                <div className='is-flex-col align-end justify-end'>
                                    <div style={{ marginBottom: '.6rem' }}>{tUseTeams == true ? "Équipes" : tUseTeams == false ? "Joueurs" : "Opposants"} max par match :</div>
                                    <div style={{ marginBottom: '.6rem' }}>Qualifiés pour la manche suivante :</div>
                                    <div>Nombre {tUseTeams == true ? "d'équipes" : tUseTeams == false ? "de joueurs" : "d'opposants"} max dans le tournoi :</div>
                                </div>
                                <div className='is-flex-col'>
                                    <div className='is-flex gap-5'>
                                        {tSizes.map((_, i) =>
                                            <div key={i} className='is-flex-col align-center gap-2'>
                                                <div>Manche {i + 1}</div>
                                                <CustomSelect
                                                    variable={tSizes[i]}
                                                    setter={(v: string) =>
                                                        set_tSizes(tSizes.slice(0, i).concat([Number(v)], tSizes.slice(i + 1)))
                                                    }
                                                    items={range(i == 0 ? 2 : tAdvancers[i - 1] > 2 ? tAdvancers[i - 1] : 2, i == 0 ? 128 : tAdvancers[i - 1] * 5, i == 0 ? 1 : tAdvancers[i - 1]).map(d => { return { label: String(d), value: d } })}
                                                    customClass=''
                                                    itemsToShow={6}
                                                />
                                                {i < tNbRounds - 1 ?
                                                    <CustomSelect
                                                        variable={tAdvancers[i]}
                                                        setter={(v: string) =>
                                                            set_tAdvancers(tAdvancers.slice(0, i).concat([Number(v)], tAdvancers.slice(i + 1)))
                                                        }
                                                        items={range(1, tSizes[i], 1).map(d => { return { label: String(d), value: d } })}
                                                        customClass=''
                                                        itemsToShow={6}
                                                    />
                                                    :
                                                    <div></div>
                                                }
                                                {i == 0 && <div>{GetFFAMaxPlayers(tSizes, tAdvancers)}</div>}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </>
                    }
                    {/* Si GroupStage */}
                    {tType == BracketType.GroupStage &&
                        <>
                        <div className='is-flex gap-3'>
                            <div className='has-text-right is-one-fifth'>Group size :</div>
                            <CustomSelect
                                variable={tGroupSize}
                                setter={(value: string) => {
                                    if (Number(value) >= 1)
                                        set_groupSize(Number(value))
                                }}
                                items={range(1, 10, 1).map(d => { return { label: String(d), value: d } })}
                                itemsToShow={6}
                            />
                        </div>
                            <div className='is-flex gap-3'>
                                <div className='has-text-right is-one-fifth'>Win points :</div>
                                <CustomSelect
                                    variable={tWinPoints}
                                    setter={(value: string) => {
                                        if (Number(value) >= 1)
                                            set_winPoints(Number(value))
                                    }}
                                    items={range(1, 10, 1).map(d => { return { label: String(d), value: d } })}
                                    itemsToShow={6}
                                />
                            </div>
                            <div className='is-flex gap-3'>
                                <div className='has-text-right is-one-fifth'>Tie points :</div>
                                <CustomSelect
                                    variable={tTiePoints}
                                    setter={(value: string) => {
                                        if (Number(value) >= 1)
                                            set_tiePoints(Number(value))
                                    }}
                                    items={range(1, 10, 1).map(d => { return { label: String(d), value: d } })}
                                    itemsToShow={6}
                                />
                            </div>
                        </>
                    }
                    {/* Si team */}
                    {tUseTeams &&
                        <>
                            <div className='is-flex align-center gap-3'>
                                <div className='has-text-right is-one-fifth'>Nombre de joueurs par équipe :</div>
                                <CustomSelect
                                    variable={tTeamsMaxSize}
                                    setter={(v: string) => set_tTeamsMaxSize(Number(v))}
                                    items={range(2, 64, 1).map(d => { return { label: String(d), value: d } })}
                                    itemsToShow={4}
                                    showOnTop={true}
                                />
                            </div>
                            <div className='is-flex'>
                                <div className='has-text-right is-one-fifth'>Les joueurs peuvent créer des équipes :</div>
                                <CustomRadio variable={tUsersCanCreateTeams} setter={set_tUsersCanCreateTeams} items={[{ label: 'non', value: false }, { label: 'oui', value: true }]} />
                            </div>
                        </>
                    }
                    <div className='is-flex grow align-end justify-space-between pb-4'>
                        <CustomButton
                            callback={() => set_editStep(editStep - 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={['Précédent']}
                        />
                        <CustomButton
                            callback={() => set_editStep(editStep + 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={['Suivant']}
                        />
                    </div>
                </div>
            </div>

            <div className={`is-clipped has-background-secondary-level is-flex-col ${editStep == tournamentEditSteps.COMMENTS ? "grow no-basis" : ""}`}>
                <div className="is-title medium is-uppercase py-2 px-4">
                    Commentaires
                </div>
                <div className="is-flex-col gap-5 grow px-4" style={{ maxHeight: editStep == tournamentEditSteps.COMMENTS ? undefined : 0 }}>
                    <div className='is-flex gap-3'>
                        <p className='has-text-right is-one-fifth'>Commentaires :</p>
                        <div className='is-flex-col gap-2 grow no-basis'>
                            <textarea placeholder="Commentaires" value={tComments} onChange={(e) => { set_tComments(e.target.value); }} rows={8} />
                            <div className='is-size-7'>Dans cette zone tu peux ajouter d’autres informations utiles pour le tournoi comme par exemple des règles, l’emplacement du jeu, ou les identifiants pour le serveur.</div>
                        </div>
                    </div>
                    <div className='is-flex grow align-end justify-space-between pb-4'>
                        <CustomButton
                            callback={() => set_editStep(editStep - 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={['Précédent']}
                        />
                        <CustomButton
                            callback={existingTournament ? UpdateTournament : PublishTournament}
                            colorClass='has-background-primary-accent'
                            contentItems={['Publier']}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
