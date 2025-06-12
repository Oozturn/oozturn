import { ChangeEvent, useRef, useState } from "react"
import { Days, range } from "~/lib/utils/ranges"
import { BracketSettings, BracketType, TournamentFullData, TournamentProperties, TournamentSettings, TournamentStatus } from "~/lib/tournamentEngine/types"
import { clickorkey } from "~/lib/utils/clickorkey"
import { useLan } from "~/lib/components/contexts/LanContext"
import { CustomSelect } from "~/lib/components/elements/custom-select"
import { EditGlobalTournamentPoints } from "~/lib/components/elements/global-tournament-points"
import { CustomButton } from "~/lib/components/elements/custom-button"
import { DuelSVG, FFASVG, GroupStageSVG, OnlyFinalSVG, QualifAndFinalSVG, SoloSVG, TeamSVG } from "~/lib/components/data/svg-container"
import { CustomRadio } from "~/lib/components/elements/custom-radio"
import { Duel } from "~/lib/tournamentEngine/tournament/duel"
import { GetFFAMaxPlayers } from "~/lib/utils/tournaments"
import { useFetcher } from "@remix-run/react"
import { notifyError } from "~/lib/components/notification"

const enum tournamentEditSteps {
    PROPERTIES,
    MATCHSTYPE,
    PARAMETERS,
    COMMENTS,
}

interface TournamentEditProps {
    existingTournament?: TournamentFullData
}
export default function TournamentEdit({ existingTournament }: TournamentEditProps) {

    const lan = useLan()

    const [editStep, set_editStep] = useState<tournamentEditSteps>(tournamentEditSteps.PROPERTIES)

    const [tournamentImageFile, setTournamentImageFile] = useState<File>()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const tId = existingTournament ? existingTournament.id : Date.now().toString()

    const [tTournamentProperties, set_tTournamentProperties] = useState<Partial<TournamentProperties>>(existingTournament ? existingTournament.properties : {
        globalTournamentPoints: { leaders: lan.globalTournamentDefaultPoints.leaders.slice(), default: lan.globalTournamentDefaultPoints.default },
        startTime: { day: lan.startDate.day, hour: lan.startDate.hour, min: lan.startDate.min },
        name: ""
    })
    const [tournamentImageSrc, setTournamentImageSrc] = useState(tTournamentProperties.picture ? '/tournaments/' + tTournamentProperties.picture : "")
    const handlePropertiesChange = (properties: Partial<TournamentProperties>) => { set_tTournamentProperties({ ...tTournamentProperties, ...properties }) }

    const [tTournamentSettings, set_tTournamentSettings] = useState<Partial<TournamentSettings>>(existingTournament ? existingTournament.settings : {
        teamsMaxSize: 4
    })
    const handleTournamentSettingsChange = (settings: Partial<TournamentSettings>) => { set_tTournamentSettings({ ...tTournamentSettings, ...settings }) }

    const [hasTwoPhases, set_HasTwoPhases] = useState<boolean | undefined>(existingTournament ? existingTournament.bracketsCount == 2 ? true : false : undefined)
    const [tFinaleSettings, set_tFinaleSettings] = useState<Partial<BracketSettings>>(existingTournament ? existingTournament.bracketSettings[existingTournament.bracketsCount == 2 ? 1 : 0] : {
        sizes: [6, 6],
        advancers: [3]
    })
    const handleFinaleSettingsChange = (settings: Partial<BracketSettings>) => { set_tFinaleSettings({ ...tFinaleSettings, ...settings }) }
    const [tQualifSettings, set_tQualifSettings] = useState<Partial<BracketSettings>>(existingTournament ? existingTournament.bracketsCount == 2 ? existingTournament.bracketSettings[0] : {} : {})
    const handleQualifSettingsChange = (settings: Partial<BracketSettings>) => { set_tQualifSettings({ ...tQualifSettings, ...settings }) }

    const [tLowerScoreIsBetter, set_tLowerScoreIsBetter] = useState(existingTournament ? existingTournament.bracketSettings[0].lowerScoreIsBetter : undefined)

    // FFA options
    const [tNbRounds, set_tNbRounds] = useState(existingTournament ? existingTournament.bracketSettings[0].sizes?.length || 2 : 2)
    const finaleSizes = () => { return tFinaleSettings.sizes || [3] }
    const finaleAdvancers = () => { return tFinaleSettings.advancers || [3] }

    const runningTournament = existingTournament && ![TournamentStatus.Open, TournamentStatus.Balancing].includes(existingTournament.status)


    const fetcher = useFetcher()
    function PublishTournament() {
        const id: string = tId
        const properties: TournamentProperties = {
            name: "",
            startTime: lan.startDate,
            globalTournamentPoints: lan.globalTournamentDefaultPoints,
            comments: "",
            ...tTournamentProperties
        }
        const settings: TournamentSettings = {
            useTeams: false,
            ...tTournamentSettings
        }
        const finaleSettings: BracketSettings = {
            type: BracketType.Duel,
            lowerScoreIsBetter: tLowerScoreIsBetter,
            ...tFinaleSettings
        }
        const qualificationSettings: BracketSettings = {
            type: BracketType.FFA,
            lowerScoreIsBetter: tLowerScoreIsBetter,
            ...tQualifSettings
        }

        const formData = new FormData();
        formData.append("intent", "createTournament")
        formData.append("tournamentId", id)
        if (tournamentImageFile) formData.append("tournamentImageFile", tournamentImageFile)
        if (tournamentImageSrc) formData.append("tournamentHasImage", "true")
        else formData.append("tournamentHasImage", "false")
        formData.append("tournamentProperties", JSON.stringify(properties))
        formData.append("tournamentSettings", JSON.stringify(settings))
        formData.append("tournamentBracketSettings", JSON.stringify(hasTwoPhases ? [qualificationSettings, finaleSettings] : [finaleSettings]))

        fetcher.submit(
            formData,
            { method: "POST", encType: "multipart/form-data", action: "/tournaments/api" }
        )
    }
    function UpdateTournament() {
        const finaleSettings: Partial<BracketSettings> = {
            type: BracketType.Duel,
            lowerScoreIsBetter: tLowerScoreIsBetter,
            ...tFinaleSettings
        }
        const qualificationSettings: Partial<BracketSettings> = {
            type: BracketType.FFA,
            lowerScoreIsBetter: tLowerScoreIsBetter,
            ...tQualifSettings
        }

        const formData = new FormData();
        formData.append("intent", "updateTournament")
        formData.append("tournamentId", tId)
        if (tournamentImageFile) formData.append("tournamentImageFile", tournamentImageFile)
        if (tournamentImageSrc) formData.append("tournamentHasImage", "true")
        else formData.append("tournamentHasImage", "false")
        formData.append("tournamentProperties", JSON.stringify(tTournamentProperties))
        formData.append("tournamentSettings", JSON.stringify(tTournamentSettings))
        formData.append("tournamentBracketSettings", JSON.stringify(hasTwoPhases ? [qualificationSettings, finaleSettings] : [finaleSettings]))

        fetcher.submit(
            formData,
            { method: "POST", encType: "multipart/form-data", action: "/tournaments/api" }
        )
    }

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files) {
            if (e.target.files[0].size > 6 * 1024 * 1024) {
                notifyError("Image is too big (6MB max.)")
                return
            }
            const reader = new FileReader()
            reader.readAsDataURL(e.target.files[0])
            reader.onload = () => {
                console.log('called: ', reader)
                if (reader.result) {
                    setTournamentImageSrc(reader.result as string)
                    setTournamentImageFile(e.target.files![0])
                }
            }
        }
    }

    return (
        <div className="is-flex-col grow gap-2 p-0 is-full-height">
            <div className="is-title big is-uppercase has-background-secondary-level p-2 px-4" {...clickorkey(() => set_editStep(tournamentEditSteps.PROPERTIES))}>
                {existingTournament ? "Édition de " + tTournamentProperties.name || "" : "Nouveau tournoi"}
            </div>
            {/* Page heading */}
            <div className="is-flex-row is-clipped">
                <div className={`tournamentEditSectionTitle has-text is-relative is-title medium py-2 is-flex align-center justify-center grow no-basis
                    ${editStep == tournamentEditSteps.PROPERTIES ? "active" : ""}
                    ${editStep > tournamentEditSteps.PROPERTIES ? "is-clickable" : ""}`}
                    {...clickorkey(() => editStep > tournamentEditSteps.PROPERTIES && set_editStep(tournamentEditSteps.PROPERTIES))}>
                    Propriétés du tournoi
                </div>
                <div className={`tournamentEditSectionTitle has-text is-relative is-title medium py-2 is-flex align-center justify-center grow no-basis
                    ${editStep == tournamentEditSteps.MATCHSTYPE ? "active" : ""}
                    ${(editStep > tournamentEditSteps.MATCHSTYPE) && !runningTournament ? "is-clickable" : ""}`}
                    {...clickorkey(() => (editStep > tournamentEditSteps.MATCHSTYPE) && !runningTournament && set_editStep(tournamentEditSteps.MATCHSTYPE))}>
                    Type de match
                </div>
                <div className={`tournamentEditSectionTitle has-text is-relative is-title medium py-2 is-flex align-center justify-center grow no-basis
                    ${editStep == tournamentEditSteps.PARAMETERS ? "active" : ""}
                    ${(editStep > tournamentEditSteps.PARAMETERS) && !runningTournament ? "is-clickable" : ""}`}
                    {...clickorkey(() => (editStep > tournamentEditSteps.PARAMETERS) && !runningTournament && set_editStep(tournamentEditSteps.PARAMETERS))}>
                    Déroulement du tournoi
                </div>
                <div className={`tournamentEditSectionTitle has-text is-relative is-title medium py-2 is-flex align-center justify-center grow no-basis
                    ${editStep == tournamentEditSteps.COMMENTS ? "active" : ""}
                    ${editStep > tournamentEditSteps.COMMENTS ? "is-clickable" : ""}`}
                    {...clickorkey(() => editStep > tournamentEditSteps.COMMENTS && set_editStep(tournamentEditSteps.COMMENTS))}>
                    Commentaires
                </div>
            </div>
            <div className="is-scrollable gap-6 has-background-secondary-level p-4 grow no-basis is-flex-col">
                {/* Properties */}
                {editStep == tournamentEditSteps.PROPERTIES && <>
                    <div className='is-flex align-center gap-5'>
                        <div className='has-text-right is-one-fifth'>Nom du tournoi :</div>
                        <input className='input is-one-third' type="text" placeholder="Nom du tournoi" value={tTournamentProperties.name} onChange={(e) => { handlePropertiesChange({ name: e.target.value }); }} />
                    </div>
                    <div className='is-flex gap-5'>
                        <div className='has-text-right is-one-fifth'>Image :</div>
                        <div className="is-flex align-end gap-5">
                            <img
                                {...clickorkey(() => fileInputRef.current?.click())}
                                src={tournamentImageSrc || "/none.webp"}
                                className="is-clickable"
                                title="Changer d'image"
                                style={{
                                    objectFit: "cover",
                                    width: '275px',
                                    height: '150px',
                                    backgroundImage: "var(--generic-game-image)",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center"
                                }}
                            />
                            <div className="is-flex-col gap-1">
                                <input
                                    id="selectAvatarInput"
                                    name="tournamentImage"
                                    ref={fileInputRef}
                                    hidden
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handleFileChange}
                                />
                                {tTournamentProperties.picture &&
                                    <CustomButton
                                        callback={() => { setTournamentImageSrc(""); setTournamentImageFile(undefined) }}
                                        contentItems={["Retirer l'image"]}
                                    />
                                }
                                <CustomButton
                                    callback={() => fileInputRef.current?.click()}
                                    contentItems={["Changer d'image"]}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="is-flex gap-5">
                        <div className='has-text-right is-one-fifth'>Points au classement global :</div>
                        <div className="is-flex-col gap-2">
                            <EditGlobalTournamentPoints points={tTournamentProperties.globalTournamentPoints || { leaders: lan.globalTournamentDefaultPoints.leaders.slice(), default: lan.globalTournamentDefaultPoints.default }} updatePoints={(pts) => handlePropertiesChange({ globalTournamentPoints: pts })} />
                            <div className='is-size-7 no-basis grow is-align-self-flex-end'>Dans ce tableau, indique le nombre de points que les joueurs recevront en fonction de leur classement.</div>
                        </div>
                    </div>
                    <div className='is-flex gap-5'>
                        <p className='has-text-right is-one-fifth'>Début du tournoi :</p>
                        <div className="is-flex-col gap-2">
                            <div className='is-flex align-center gap-3'>
                                <CustomSelect
                                    variable={tTournamentProperties.startTime?.day}
                                    setter={(v: string) => handlePropertiesChange({ startTime: { ...tTournamentProperties.startTime!, day: Number(v) } })}
                                    items={[...range(lan.startDate.day, 6, 1), ...range(0, lan.endDate.day, 1)].map(d => { return { label: Days[d], value: d } })}
                                />
                                <CustomSelect
                                    variable={tTournamentProperties.startTime?.hour}
                                    setter={(v: string) => handlePropertiesChange({ startTime: { ...tTournamentProperties.startTime!, hour: Number(v) } })}
                                    items={range(tTournamentProperties.startTime?.day == lan.startDate.day ? lan.startDate.hour : 0, tTournamentProperties.startTime?.day == lan.endDate.day ? lan.endDate.hour - 1 : 23, 1).map(d => { return { label: String(d) + "h ", value: d } })}
                                    customClass='mr-1'
                                    itemsToShow={7}
                                />
                            </div>
                            <div className="is-size-7 no-basis grow is-align-self-flex-end">Cette info est indicative seulement, le tournoi sera démarré manuellement</div>
                        </div>
                    </div>
                    <div className='is-flex grow align-end justify-end'>
                        <CustomButton
                            callback={() => set_editStep(editStep + (runningTournament ? 3 : 1))}
                            colorClass='has-background-primary-accent'
                            contentItems={['Suivant']}
                        />
                    </div>
                </>}
                {/* Match type */}
                {editStep == tournamentEditSteps.MATCHSTYPE && <>
                    <div className='is-flex gap-4'>
                        <div className='has-text-right is-one-fifth'>Choisis le type de score :</div>
                        <div className='is-flex-col'>
                            <CustomRadio variable={tLowerScoreIsBetter} setter={set_tLowerScoreIsBetter} items={[{ label: 'Score classique', value: false }, { label: 'Score inversé', value: true }]} />
                            <div className='mx-3 is-size-7'>Sélectionne <i>score classique</i> si le camp gagnant est celui qui a le plus haut score en fin de partie.<br />Dans le cas contraire, bien sûr, sélectionne <i>Score inversé</i>.</div>
                        </div>
                    </div>
                    <div className='is-flex gap-5'>
                        <div className='has-text-right is-one-fifth'>Choisis le type de rencontre :</div>
                        <div className='is-flex gap-6 justify-center'>
                            <div className='is-flex-col align-center gap-4 no-basis'>
                                <div className={`svgSelection is-clickable ${tTournamentSettings.useTeams == false ? 'is-active' : ''}`} {...clickorkey(() => handleTournamentSettingsChange({ useTeams: false }))}>
                                    <SoloSVG />
                                </div>
                                <div className='is-title medium'>SOLO</div>
                            </div>
                            <div className='is-flex-col align-center gap-4 no-basis'>
                                <div className={`svgSelection is-clickable ${tTournamentSettings.useTeams == true ? 'is-active' : ''}`} {...clickorkey(() => handleTournamentSettingsChange({ useTeams: true }))}>
                                    <TeamSVG />
                                </div>
                                <div className='is-title medium'>ÉQUIPES</div>
                            </div>
                        </div>
                    </div>
                    {/* Si team */}
                    {tTournamentSettings.useTeams && <>
                        <div className='is-flex align-center gap-5'>
                            <div className='has-text-right is-one-fifth'>Nombre de joueurs par équipe :</div>
                            <CustomSelect
                                variable={tTournamentSettings.teamsMaxSize}
                                setter={(v: string) => handleTournamentSettingsChange({ teamsMaxSize: Number(v) })}
                                items={range(2, 64, 1).map(d => { return { label: String(d), value: d } })}
                                itemsToShow={4}
                                showOnTop={true}
                            />
                        </div>
                        <div className='is-flex gap-4'>
                            <div className='has-text-right is-one-fifth'>Création des équipes :</div>
                            <CustomRadio variable={tTournamentSettings.usersCanCreateTeams} setter={(v: boolean) => handleTournamentSettingsChange({ usersCanCreateTeams: v })} items={[{ label: 'Par les admins', value: false }, { label: 'Par les joueurs', value: true }]} />
                        </div>
                    </>}
                    <div className='is-flex grow align-end justify-space-between'>
                        <CustomButton
                            callback={() => set_editStep(editStep - 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={['Précédent']}
                        />
                        <CustomButton
                            active={
                                (tLowerScoreIsBetter != undefined)
                                && (tTournamentSettings.useTeams === false || (
                                    tTournamentSettings.useTeams == true
                                    && tTournamentSettings.usersCanCreateTeams != undefined
                                ))
                            }
                            callback={() => set_editStep(editStep + 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={['Suivant']}
                        />
                    </div>
                </>}
                {/* Parameters */}
                {editStep == tournamentEditSteps.PARAMETERS && <>
                    <div className='is-title medium'>Déroulement du tournoi :</div>
                    <div className='is-flex gap-5 justify-center'>
                        <div className='is-flex gap-6 justify-center'>
                            <div className='is-flex-col align-center gap-4 no-basis'>
                                <div className={`svgSelection is-clickable ${hasTwoPhases == false ? 'is-active' : ''}`} {...clickorkey(() => set_HasTwoPhases(false))}>
                                    <OnlyFinalSVG />
                                </div>
                                <div className='is-title medium'>Tournoi direct</div>
                                <div className='mx-3 is-size-7 has-text-centered'>Choisis cette option si tu veux démarrer un tournoi sans phase de qualification ou de classement.</div>
                            </div>
                            <div className='is-flex-col align-center gap-4 no-basis'>
                                <div className={`svgSelection is-clickable ${hasTwoPhases == true ? 'is-active' : ''}`} {...clickorkey(() => set_HasTwoPhases(true))}>
                                    <QualifAndFinalSVG />
                                </div>
                                <div className='is-title medium'>Phase de poule et phase finale</div>
                                <div className='mx-3 is-size-7 has-text-centered'>Choisis cette option pour un tounoi en deux phases :<br />Une phase de poule pour classer et/ou réduire le nombre de joueurs, puis une phase finale pour établir le classement final.</div>
                            </div>
                        </div>
                    </div>
                    {hasTwoPhases != undefined && <>
                        {hasTwoPhases && <> {/* Qualification */}
                            {/* Qualification type selection */} <>
                                <div className='is-title medium'>Type de phase de poule :</div>
                                <div className='is-flex gap-5 justify-center'>
                                    <div className='is-flex gap-6 justify-center'>
                                        <div className='is-flex-col align-center gap-4 no-basis'>
                                            <div className={`svgSelection is-clickable ${tQualifSettings.type == BracketType.FFA ? 'is-active' : ''}`} {...clickorkey(() => handleQualifSettingsChange({ type: BracketType.FFA }))}>
                                                <FFASVG />
                                            </div>
                                            <div className='is-title medium'>FFA</div>
                                        </div>
                                        <div className='is-flex-col align-center gap-4 no-basis'>
                                            <div className={`svgSelection is-clickable ${tQualifSettings.type == BracketType.GroupStage ? 'is-active' : ''}`} {...clickorkey(() => handleQualifSettingsChange({ type: BracketType.GroupStage }))}>
                                                <GroupStageSVG />
                                            </div>
                                            <div className='is-title medium'>Round robin</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                            {/* Qualification options */} <>
                                <div className='is-flex align-center gap-5'>
                                    <div className='has-text-right is-one-third'>Nombre {tTournamentSettings.useTeams ? "d'équipes" : "de joueurs"} par poule :</div>
                                    <CustomSelect
                                        variable={tQualifSettings.groupSize}
                                        setter={(v: string) => handleQualifSettingsChange({ groupSize: Number(v), sizes: [Number(v)] })}
                                        items={range(2, 64, 1).map(d => { return { label: String(d), value: d } })}
                                    />
                                </div>
                                <div className='is-flex align-center gap-5'>
                                    <div className='has-text-right is-one-third'>Nombre {tTournamentSettings.useTeams ? "d'équipes" : "de joueurs"} sélectionnés pour la phase suivante :</div>
                                    <CustomSelect
                                        variable={tFinaleSettings.size}
                                        setter={(v: string) => handleFinaleSettingsChange({ size: Number(v) })}
                                        items={[{ label: tTournamentSettings.useTeams ? "Toutes" : "Tous", value: 0 }, ...range(2, 64, 1).map(d => { return { label: String(d), value: d } })]}
                                        itemsToShow={8}
                                    />
                                    {tFinaleSettings.type == BracketType.Duel && tFinaleSettings.size && ((tFinaleSettings.size & (tFinaleSettings.size - 1)) != 0) &&
                                        <div className='mx-3 is-size-7 has-text-primary-accent'>Le nombre {tTournamentSettings.useTeams ? "d'équipes qualifiées" : "de joueurs qualifiés"} n&apos;est pas optimal pour le type de finale sélectionné.</div>
                                    }
                                </div>
                                {tQualifSettings.type == BracketType.GroupStage && <>
                                    <div className='is-flex gap-4'>
                                        <div className='has-text-right is-one-third'>Matchs aller/retour :</div>
                                        <div className='is-flex-col'>
                                            <CustomRadio variable={tQualifSettings.meetTwice} setter={(v: boolean) => handleQualifSettingsChange({ meetTwice: v })} items={[{ label: 'non', value: false }, { label: 'oui', value: true }]} />
                                            <div className='mx-3 is-size-7'>En selectionnant oui les {tTournamentSettings.useTeams ? "équipes" : "joueurs"} se rencontreront 2 fois dans chaque poule.</div>
                                        </div>
                                    </div>
                                </>}
                            </>
                        </>}
                        {/* Finale type selection */} <>
                            <div className='is-title medium'>Type de {hasTwoPhases ? "finale" : "tournoi"} :</div>
                            <div className='is-flex gap-5 justify-center'>
                                <div className='is-flex gap-6 justify-center'>
                                    <div className='is-flex-col align-center gap-4 no-basis'>
                                        <div className={`svgSelection is-clickable ${tFinaleSettings.type == BracketType.Duel ? 'is-active' : ''}`} {...clickorkey(() => handleFinaleSettingsChange({ type: BracketType.Duel }))}>
                                            <DuelSVG />
                                        </div>
                                        <div className='is-title medium'>Duel</div>
                                    </div>
                                    <div className='is-flex-col align-center gap-4 no-basis'>
                                        <div className={`svgSelection is-clickable ${tFinaleSettings.type == BracketType.FFA ? 'is-active' : ''}`} {...clickorkey(() => handleFinaleSettingsChange({ type: BracketType.FFA }))}>
                                            <FFASVG />
                                        </div>
                                        <div className='is-title medium'>FFA</div>
                                    </div>
                                    {hasTwoPhases == false &&
                                        <div className='is-flex-col align-center gap-4 no-basis'>
                                            <div className={`svgSelection is-clickable ${tFinaleSettings.type == BracketType.GroupStage ? 'is-active' : ''}`} {...clickorkey(() => handleFinaleSettingsChange({ type: BracketType.GroupStage }))}>
                                                <GroupStageSVG />
                                            </div>
                                            <div className='is-title medium'>Round robin</div>
                                        </div>
                                    }
                                </div>
                            </div>
                        </>

                        {/* DUEL Options */}
                        {tFinaleSettings.type == BracketType.Duel && <>
                            <div className='is-flex gap-4'>
                                <div className='has-text-right is-one-third'>Rattrapage :</div>
                                <div className='is-flex-col no-basis grow'>
                                    <CustomRadio variable={tFinaleSettings.last} setter={(v: number) => handleFinaleSettingsChange({ last: v })} items={[{ label: 'non', value: Duel.WB }, { label: 'oui', value: Duel.LB }]} />
                                    <div className='mx-3 is-size-7'>En sélectionnant <i>non</i>, le tournoi sera à élimination directe, une défaite et zou, tu dégages ! En sélectionnant <i>oui</i>, les joueurs qui perdent une première fois restent en compétition. Au prix de sang et de larmes ils pourront revenir au sommet. Mais en cas de seconde défaite prends ton flambeau, la sentance sera irrévocable.</div>
                                </div>
                            </div>
                            <div className='is-flex gap-4'>
                                <div className='has-text-right is-one-third'>Format court :</div>
                                <div className='is-flex-col no-basis grow'>
                                    <CustomRadio variable={tFinaleSettings.short} setter={(v: boolean) => handleFinaleSettingsChange({ short: v })} items={[{ label: 'non', value: false }, { label: 'oui', value: true }]} />
                                    {tFinaleSettings.last == Duel.LB &&
                                        <div className='mx-3 is-size-7'>En sélectionnant <i>oui</i>, il n&apos;y aura pas de double finale. Le gagnant du rattrapage pourra voler la victoire contre le gagnant du tableau principal en une rencontre. C&apos;est pas juste, mais c&apos;est comme ça. En sélectionnant <i>non</i>, la justice reprend le dessus et le gagnant sera alors vraiment celui ayant le moins de défaites.</div>
                                    }
                                    {tFinaleSettings.last == Duel.WB &&
                                        <div className='mx-3 is-size-7'>En sélectionnant <i>oui</i>, il n&apos;y aura pas de petite finale. Premier, second, les autres sont des perdants. En sélectionnant <i>non</i>, on connaitra le vainqueur de la médaille en chocolat.</div>
                                    }
                                    {tFinaleSettings.last == undefined &&
                                        <div className='mx-3 is-size-7'>Sélectionne une option de rattrapage pour avoir des précisions sur ce paramètre</div>
                                    }
                                </div>
                            </div>
                        </>}
                        {/* FFA Options */}
                        {tFinaleSettings.type == BracketType.FFA && <>
                            <div className='is-flex gap-5'>
                                <div className='has-text-right is-one-third'>Nombre de manches :</div>
                                <CustomSelect
                                    variable={tNbRounds}
                                    setter={(value: string) => {
                                        if (Number(value) >= 1) {
                                            set_tNbRounds(Number(value))
                                            handleFinaleSettingsChange({
                                                sizes: Array.from(Array(Number(value)), (_, i) => (finaleSizes()[i]) || 6),
                                                advancers: Array.from(Array(Number(value) - 1), (_, i) => (finaleAdvancers()[i]) || 3)
                                            })
                                        }
                                    }}
                                    items={range(1, 10, 1).map(d => { return { label: String(d), value: d } })}
                                    itemsToShow={6}
                                />
                            </div>
                            <div className='is-flex gap-4'>
                                <div className='is-flex-col align-end justify-end is-one-third'>
                                    <div style={{ marginBottom: '.6rem' }}></div>
                                    <div style={{ marginBottom: '.6rem' }}>{tTournamentSettings.useTeams == true ? "Équipes" : tTournamentSettings.useTeams == false ? "Joueurs" : "Opposants"} max par match :</div>
                                    <div style={{ marginBottom: '.6rem' }}>Qualifiés pour la manche suivante :</div>
                                    <div>Nombre {tTournamentSettings.useTeams == true ? "d'équipes" : tTournamentSettings.useTeams == false ? "de joueurs" : "d'opposants"} max dans le tournoi :</div>
                                </div>
                                <div className='is-flex-col'>
                                    <div className='is-flex gap-5'>
                                        {tFinaleSettings.sizes?.map((_, i) =>
                                            <div key={i} className='is-flex-col align-center gap-2'>
                                                <div>Manche {i + 1}</div>
                                                <CustomSelect
                                                    variable={finaleSizes()[i]}
                                                    setter={(v: string) =>
                                                        handleFinaleSettingsChange({ sizes: finaleSizes().slice(0, i).concat([Number(v)], finaleSizes().slice(i + 1)) })
                                                    }
                                                    items={range(i == 0 ? 2 : finaleAdvancers()[i - 1] > 2 ? finaleAdvancers()[i - 1] : 2, i == 0 ? 128 : finaleAdvancers()[i - 1] * 5, i == 0 ? 1 : finaleAdvancers()[i - 1]).map(d => { return { label: String(d), value: d } })}
                                                    customClass=''
                                                    itemsToShow={6}
                                                />
                                                {i < tNbRounds - 1 ?
                                                    <CustomSelect
                                                        variable={finaleAdvancers()[i]}
                                                        setter={(v: string) =>
                                                            handleFinaleSettingsChange({ advancers: finaleAdvancers().slice(0, i).concat([Number(v)], finaleAdvancers().slice(i + 1)) })
                                                        }
                                                        items={range(1, finaleSizes()[i], 1).map(d => { return { label: String(d), value: d } })}
                                                        customClass=''
                                                        itemsToShow={6}
                                                    />
                                                    :
                                                    <div></div>
                                                }
                                                {i == 0 && <div>{GetFFAMaxPlayers(finaleSizes(), finaleAdvancers())}</div>}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </>}
                        {/* GroupStage Options */}
                        {hasTwoPhases == false && tFinaleSettings.type == BracketType.GroupStage && <>
                            <div className='is-flex gap-5'>
                                <div className='has-text-right is-one-third'>Nombre {tTournamentSettings.useTeams ? "d'équipes" : "de joueurs"} par groupe :</div>
                                <CustomSelect
                                    variable={tFinaleSettings.groupSize}
                                    setter={(value: string) => {
                                        if (Number(value) >= 1)
                                            handleFinaleSettingsChange({ groupSize: Number(value) })
                                    }}
                                    items={range(1, 10, 1).map(d => { return { label: String(d), value: d } })}
                                    itemsToShow={6}
                                />
                            </div>
                            <div className='is-flex gap-5'>
                                <div className='has-text-right is-one-third'>Points par victoires :</div>
                                <CustomSelect
                                    variable={tFinaleSettings.winPoints}
                                    setter={(value: string) => {
                                        if (Number(value) >= 1)
                                            handleFinaleSettingsChange({ winPoints: Number(value) })
                                    }}
                                    items={range(1, 10, 1).map(d => { return { label: String(d), value: d } })}
                                    itemsToShow={5}
                                />
                            </div>
                            <div className='is-flex gap-5'>
                                <div className='has-text-right is-one-third'>Points par matchs nuls :</div>
                                <CustomSelect
                                    variable={tFinaleSettings.tiePoints}
                                    setter={(value: string) => {
                                        if (Number(value) >= 1)
                                            handleFinaleSettingsChange({ tiePoints: Number(value) })
                                    }}
                                    items={range(0, 9, 1).map(d => { return { label: String(d), value: d } })}
                                    itemsToShow={5}
                                />
                            </div>
                            <div className='is-flex gap-4'>
                                <div className='has-text-right is-one-third'>Matchs aller/retour :</div>
                                <div className='is-flex-col'>
                                    <CustomRadio variable={tFinaleSettings.meetTwice} setter={(v: boolean) => handleFinaleSettingsChange({ meetTwice: v })} items={[{ label: 'non', value: false }, { label: 'oui', value: true }]} />
                                    <div className='mx-3 is-size-7'>En selectionnant oui les {tTournamentSettings.useTeams ? "équipes" : "joueurs"} se rencontreront 2 fois dans chaque poule.</div>
                                </div>
                            </div>
                        </>
                        }
                    </>}
                    <div className='is-flex grow align-end justify-space-between'>
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
                </>}
                {/* Comments */}
                {editStep == tournamentEditSteps.COMMENTS && <>
                    <div className='is-flex gap-3'>
                        <p className='has-text-right is-one-fifth'>Commentaires :</p>
                        <div className='is-flex-col gap-2 is-three-fifths'>
                            <textarea placeholder="Commentaires" value={tTournamentProperties.comments} onChange={(e) => { handlePropertiesChange({ comments: e.target.value }); }} rows={8} />
                            <div className='is-size-7'>Dans cette zone tu peux ajouter d’autres informations utiles pour le tournoi comme par exemple des règles, l’emplacement du jeu, ou les identifiants pour le serveur.</div>
                        </div>
                    </div>
                    <div className='is-flex grow align-end justify-space-between'>
                        <CustomButton
                            callback={() => set_editStep(editStep - (runningTournament ? 3 : 1))}
                            colorClass='has-background-primary-accent'
                            contentItems={['Précédent']}
                        />
                        <CustomButton
                            callback={existingTournament ? UpdateTournament : PublishTournament}
                            colorClass='has-background-primary-accent'
                            contentItems={['Publier']}
                        />
                    </div>
                </>}
            </div>
        </div>
    )
}
