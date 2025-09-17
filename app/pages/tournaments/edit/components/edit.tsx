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
import { Trans, useTranslation } from "react-i18next"

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

    const { t } = useTranslation()

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
                    {t("tournoi.proprietes")}
                </div>
                <div className={`tournamentEditSectionTitle has-text is-relative is-title medium py-2 is-flex align-center justify-center grow no-basis
                    ${editStep == tournamentEditSteps.MATCHSTYPE ? "active" : ""}
                    ${(editStep > tournamentEditSteps.MATCHSTYPE) && !runningTournament ? "is-clickable" : ""}`}
                    {...clickorkey(() => (editStep > tournamentEditSteps.MATCHSTYPE) && !runningTournament && set_editStep(tournamentEditSteps.MATCHSTYPE))}>
                    {t("tournoi.type_de_matchs")}
                </div>
                <div className={`tournamentEditSectionTitle has-text is-relative is-title medium py-2 is-flex align-center justify-center grow no-basis
                    ${editStep == tournamentEditSteps.PARAMETERS ? "active" : ""}
                    ${(editStep > tournamentEditSteps.PARAMETERS) && !runningTournament ? "is-clickable" : ""}`}
                    {...clickorkey(() => (editStep > tournamentEditSteps.PARAMETERS) && !runningTournament && set_editStep(tournamentEditSteps.PARAMETERS))}>
                    {t("tournoi.deroulement")}
                </div>
                <div className={`tournamentEditSectionTitle has-text is-relative is-title medium py-2 is-flex align-center justify-center grow no-basis
                    ${editStep == tournamentEditSteps.COMMENTS ? "active" : ""}
                    ${editStep > tournamentEditSteps.COMMENTS ? "is-clickable" : ""}`}
                    {...clickorkey(() => editStep > tournamentEditSteps.COMMENTS && set_editStep(tournamentEditSteps.COMMENTS))}>
                    {t("tournoi.commentaires")}
                </div>
            </div>
            <div className="is-scrollable gap-6 has-background-secondary-level p-4 grow no-basis is-flex-col">
                {/* Properties */}
                {editStep == tournamentEditSteps.PROPERTIES && <>
                    <div className='is-flex align-center gap-5'>
                        <div className='has-text-right is-one-fifth'>{t("tournoi.nom_tournoi_colon")}</div>
                        <input className='input is-one-third' type="text" placeholder={t("tournoi.nom_tournoi_placeholder")} value={tTournamentProperties.name} onChange={(e) => { handlePropertiesChange({ name: e.target.value }); }} />
                    </div>
                    <div className='is-flex gap-5'>
                        <div className='has-text-right is-one-fifth'>{t("tournoi.image_tournoi_colon")}</div>
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
                                {tournamentImageSrc &&
                                    <CustomButton
                                        callback={() => { setTournamentImageSrc(""); setTournamentImageFile(undefined) }}
                                        contentItems={[t("boutons.retirer_image")]}
                                    />
                                }
                                <CustomButton
                                    callback={() => fileInputRef.current?.click()}
                                    contentItems={[t("boutons.changer_image")]}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="is-flex gap-5">
                        <div className='has-text-right is-one-fifth'>{t("tournoi.pts_classement_global_colon")}</div>
                        <div className="is-flex-col gap-2">
                            <EditGlobalTournamentPoints points={tTournamentProperties.globalTournamentPoints || { leaders: lan.globalTournamentDefaultPoints.leaders.slice(), default: lan.globalTournamentDefaultPoints.default }} updatePoints={(pts) => handlePropertiesChange({ globalTournamentPoints: pts })} />
                            <div className='is-size-7 no-basis grow is-align-self-flex-end'><Trans i18nKey="tournoi.pts_classement_global_hint" /></div>
                        </div>
                    </div>
                    <div className='is-flex gap-5'>
                        <p className='has-text-right is-one-fifth'>{t("tournoi.debut_tournoi_colon")}</p>
                        <div className="is-flex-col gap-2">
                            <div className='is-flex align-center gap-3'>
                                <CustomSelect
                                    variable={tTournamentProperties.startTime?.day}
                                    setter={(v: string) => handlePropertiesChange({ startTime: { ...tTournamentProperties.startTime!, day: Number(v) } })}
                                    items={[...range(lan.startDate.day, 6, 1), ...range(0, lan.endDate.day, 1)].map(d => { return { label: t(Days[d]), value: d } })}
                                />
                                <CustomSelect
                                    variable={tTournamentProperties.startTime?.hour}
                                    setter={(v: string) => handlePropertiesChange({ startTime: { ...tTournamentProperties.startTime!, hour: Number(v) } })}
                                    items={range(tTournamentProperties.startTime?.day == lan.startDate.day ? lan.startDate.hour : 0, tTournamentProperties.startTime?.day == lan.endDate.day ? lan.endDate.hour - 1 : 23, 1).map(d => { return { label: String(d) + "h ", value: d } })}
                                    customClass='mr-1'
                                    itemsToShow={7}
                                />
                            </div>
                            <div className="is-size-7 no-basis grow is-align-self-flex-end">{t("tournoi.debut_tournoi_hint")}</div>
                        </div>
                    </div>
                    <div className='is-flex grow align-end justify-end'>
                        <CustomButton
                            callback={() => set_editStep(editStep + (runningTournament ? 3 : 1))}
                            colorClass='has-background-primary-accent'
                            contentItems={[t("boutons.suivant")]}
                        />
                    </div>
                </>}
                {/* Match type */}
                {editStep == tournamentEditSteps.MATCHSTYPE && <>
                    <div className='is-flex gap-4'>
                        <div className='has-text-right is-one-fifth'>{t("tournoi.type_score_colon")}</div>
                        <div className='is-flex-col'>
                            <CustomRadio variable={tLowerScoreIsBetter} setter={set_tLowerScoreIsBetter} items={[{ label: t("tournoi.score_classique"), value: false }, { label: t("tournoi.score_inverse"), value: true }]} />
                            <div className='mx-3 is-size-7'><Trans i18nKey={"tournoi.type_score_hint"} /></div>
                        </div>
                    </div>
                    <div className='is-flex gap-5'>
                        <div className='has-text-right is-one-fifth'>{t("tournoi.type_rencontre_colon")}</div>
                        <div className='is-flex gap-6 justify-center'>
                            <div className='is-flex-col align-center gap-4 no-basis'>
                                <div className={`svgSelection is-clickable ${tTournamentSettings.useTeams == false ? 'is-active' : ''}`} {...clickorkey(() => handleTournamentSettingsChange({ useTeams: false }))}>
                                    <SoloSVG />
                                </div>
                                <div className='is-title medium'>{t("solo")}</div>
                            </div>
                            <div className='is-flex-col align-center gap-4 no-basis'>
                                <div className={`svgSelection is-clickable ${tTournamentSettings.useTeams == true ? 'is-active' : ''}`} {...clickorkey(() => handleTournamentSettingsChange({ useTeams: true }))}>
                                    <TeamSVG />
                                </div>
                                <div className='is-title medium'>{t("equipe_pluriel")}</div>
                            </div>
                        </div>
                    </div>
                    {/* Si team */}
                    {tTournamentSettings.useTeams && <>
                        <div className='is-flex align-center gap-5'>
                            <div className='has-text-right is-one-fifth'>{t("tournoi.nb_joueurs_equipe_colon")}</div>
                            <CustomSelect
                                variable={tTournamentSettings.teamsMaxSize}
                                setter={(v: string) => handleTournamentSettingsChange({ teamsMaxSize: Number(v) })}
                                items={range(2, 64, 1).map(d => { return { label: String(d), value: d } })}
                                itemsToShow={4}
                                showOnTop={true}
                            />
                        </div>
                        <div className='is-flex gap-4'>
                            <div className='has-text-right is-one-fifth'>{t("tournoi.creation_equipes_colon")}</div>
                            <CustomRadio variable={tTournamentSettings.usersCanCreateTeams} setter={(v: boolean) => handleTournamentSettingsChange({ usersCanCreateTeams: v })} items={[{ label: t("tournoi.creation_equipes_admin"), value: false }, { label: t("tournoi.creation_equipes_joueurs"), value: true }]} />
                        </div>
                    </>}
                    <div className='is-flex grow align-end justify-space-between'>
                        <CustomButton
                            callback={() => set_editStep(editStep - 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={[t("boutons.precedent")]}
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
                            contentItems={[t("boutons.suivant")]}
                        />
                    </div>
                </>}
                {/* Parameters */}
                {editStep == tournamentEditSteps.PARAMETERS && <>
                    <div className='is-title medium'>{t("tournoi.deroulement_colon")}</div>
                    <div className='is-flex gap-5 justify-center'>
                        <div className='is-flex gap-6 justify-center'>
                            <div className='is-flex-col align-center gap-4 no-basis'>
                                <div className={`svgSelection is-clickable ${hasTwoPhases == false ? 'is-active' : ''}`} {...clickorkey(() => set_HasTwoPhases(false))}>
                                    <OnlyFinalSVG />
                                </div>
                                <div className='is-title medium'>{t("tournoi.tournoi_direct")}</div>
                                <div className='mx-3 is-size-7 has-text-centered'>{t("tournoi.tournoi_direct_hint")}</div>
                            </div>
                            <div className='is-flex-col align-center gap-4 no-basis'>
                                <div className={`svgSelection is-clickable ${hasTwoPhases == true ? 'is-active' : ''}`} {...clickorkey(() => set_HasTwoPhases(true))}>
                                    <QualifAndFinalSVG />
                                </div>
                                <div className='is-title medium'>{t("tournoi.tournoi_poule")}</div>
                                <div className='mx-3 is-size-7 has-text-centered'><Trans i18nKey="tournoi.tournoi_poule_hint" /></div>
                            </div>
                        </div>
                    </div>
                    {hasTwoPhases != undefined && <>
                        {hasTwoPhases && <> {/* Qualification */}
                            {/* Qualification type selection */} <>
                                <div className='is-title medium'>{t("tournoi.type_poule_colon")}</div>
                                <div className='is-flex gap-5 justify-center'>
                                    <div className='is-flex gap-6 justify-center'>
                                        <div className='is-flex-col align-center gap-4 no-basis'>
                                            <div className={`svgSelection is-clickable ${tQualifSettings.type == BracketType.FFA ? 'is-active' : ''}`} {...clickorkey(() => handleQualifSettingsChange({ type: BracketType.FFA }))}>
                                                <FFASVG />
                                            </div>
                                            <div className='is-title medium'>{t("match.FFA")}</div>
                                        </div>
                                        <div className='is-flex-col align-center gap-4 no-basis'>
                                            <div className={`svgSelection is-clickable ${tQualifSettings.type == BracketType.GroupStage ? 'is-active' : ''}`} {...clickorkey(() => handleQualifSettingsChange({ type: BracketType.GroupStage }))}>
                                                <GroupStageSVG />
                                            </div>
                                            <div className='is-title medium'>{t("match.RoundRobin")}</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                            {/* Qualification options */} <>
                                <div className='is-flex align-center gap-5'>
                                    <div className='has-text-right is-one-third'>{tTournamentSettings.useTeams ? t("tournoi.nb_equipes_poule_colon") : t("tournoi.nb_joueurs_poule_colon")}</div>
                                    <CustomSelect
                                        variable={tQualifSettings.groupSize}
                                        setter={(v: string) => handleQualifSettingsChange({ groupSize: Number(v), sizes: [Number(v)] })}
                                        items={range(2, 64, 1).map(d => { return { label: String(d), value: d } })}
                                    />
                                </div>
                                <div className='is-flex align-center gap-5'>
                                    <div className='has-text-right is-one-third'>{tTournamentSettings.useTeams ? t("tournoi.nb_equipes_qualifiees_colon") : t("tournoi.nb_joueurs_qualifies_colon")}</div>
                                    <CustomSelect
                                        variable={tFinaleSettings.size}
                                        setter={(v: string) => handleFinaleSettingsChange({ size: Number(v) })}
                                        items={[{ label: tTournamentSettings.useTeams ? t("toutes") : t("tous"), value: 0 }, ...range(2, 64, 1).map(d => { return { label: String(d), value: d } })]}
                                        itemsToShow={8}
                                    />
                                    {tFinaleSettings.type == BracketType.Duel && tFinaleSettings.size && ((tFinaleSettings.size & (tFinaleSettings.size - 1)) != 0) &&
                                        <div className='mx-3 is-size-7 has-text-primary-accent'>{t("tournoi.nb_qualifiés_non_opti_hint")}</div>
                                    }
                                </div>
                                {tQualifSettings.type == BracketType.GroupStage && <>
                                    <div className='is-flex gap-4'>
                                        <div className='has-text-right is-one-third'>{t("tournoi.matchs_AR_colon")}</div>
                                        <div className='is-flex-col'>
                                            <CustomRadio variable={tQualifSettings.meetTwice} setter={(v: boolean) => handleQualifSettingsChange({ meetTwice: v })} items={[{ label: t("non"), value: false }, { label: t("oui"), value: true }]} />
                                            <div className='mx-3 is-size-7'>{tTournamentSettings.useTeams ? t("tournoi.matchs_AR_equipes_hint") : t("tournoi.matchs_AR_joueurs_hint")}</div>
                                        </div>
                                    </div>
                                </>}
                            </>
                        </>}
                        {/* Finale type selection */} <>
                            <div className='is-title medium'>{hasTwoPhases ? t("tournoi.type_finale_colon") : t("tournoi.type_tournoi_colon")}</div>
                            <div className='is-flex gap-5 justify-center'>
                                <div className='is-flex gap-6 justify-center'>
                                    <div className='is-flex-col align-center gap-4 no-basis'>
                                        <div className={`svgSelection is-clickable ${tFinaleSettings.type == BracketType.Duel ? 'is-active' : ''}`} {...clickorkey(() => handleFinaleSettingsChange({ type: BracketType.Duel }))}>
                                            <DuelSVG />
                                        </div>
                                        <div className='is-title medium'>{t("match.Duel")}</div>
                                    </div>
                                    <div className='is-flex-col align-center gap-4 no-basis'>
                                        <div className={`svgSelection is-clickable ${tFinaleSettings.type == BracketType.FFA ? 'is-active' : ''}`} {...clickorkey(() => handleFinaleSettingsChange({ type: BracketType.FFA }))}>
                                            <FFASVG />
                                        </div>
                                        <div className='is-title medium'>{t("match.FFA")}</div>
                                    </div>
                                    {hasTwoPhases == false &&
                                        <div className='is-flex-col align-center gap-4 no-basis'>
                                            <div className={`svgSelection is-clickable ${tFinaleSettings.type == BracketType.GroupStage ? 'is-active' : ''}`} {...clickorkey(() => handleFinaleSettingsChange({ type: BracketType.GroupStage }))}>
                                                <GroupStageSVG />
                                            </div>
                                            <div className='is-title medium'>{t(`match.RoundRobin`)}</div>
                                        </div>
                                    }
                                </div>
                            </div>
                        </>

                        {/* DUEL Options */}
                        {tFinaleSettings.type == BracketType.Duel && <>
                            <div className='is-flex gap-4'>
                                <div className='has-text-right is-one-third'>{t("tournoi.rattrapage_colon")}</div>
                                <div className='is-flex-col no-basis grow'>
                                    <CustomRadio variable={tFinaleSettings.last} setter={(v: number) => handleFinaleSettingsChange({ last: v })} items={[{ label: t("non"), value: Duel.WB }, { label: t("oui"), value: Duel.LB }]} />
                                    <div className='mx-3 is-size-7'><Trans i18nKey="tournoi.rattrapage_hint"/></div>
                                </div>
                            </div>
                            <div className='is-flex gap-4'>
                                <div className='has-text-right is-one-third'>{t("tournoi.format_court_colon")}</div>
                                <div className='is-flex-col no-basis grow'>
                                    <CustomRadio variable={tFinaleSettings.short} setter={(v: boolean) => handleFinaleSettingsChange({ short: v })} items={[{ label: t("non"), value: false }, { label: t("oui"), value: true }]} />
                                    {tFinaleSettings.last == Duel.LB &&
                                        <div className='mx-3 is-size-7'></div>
                                    }
                                    {tFinaleSettings.last == Duel.WB &&
                                        <div className='mx-3 is-size-7'><Trans i18nKey="tournoi.format_court_direct_hint" /></div>
                                    }
                                    {tFinaleSettings.last == undefined &&
                                        <div className='mx-3 is-size-7'>{t("tournoi.format_court_undefined_hint")}</div>
                                    }
                                </div>
                            </div>
                        </>}
                        {/* FFA Options */}
                        {tFinaleSettings.type == BracketType.FFA && <>
                            <div className='is-flex gap-5'>
                                <div className='has-text-right is-one-third'>{t("tournoi.nb_manches_colon")}</div>
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
                                    <div style={{ marginBottom: '.6rem' }}>{tTournamentSettings.useTeams == true ? t("tournoi.nb_equipes_par_match_colon") : tTournamentSettings.useTeams == false ? t("tournoi.nb_joueurs_par_match_colon") : t("tournoi.nb_opposants_par_match_colon")}</div>
                                    <div style={{ marginBottom: '.6rem' }}>{t("tournoi.nb_qualif_next_manche_colon")}</div>
                                    <div>{tTournamentSettings.useTeams == true ? t("tournoi.nb_equipes_max_tournoi_colon") : tTournamentSettings.useTeams == false ? t("tournoi.nb_joueurs_max_tournoi_colon") : t("tournoi.nb_opposants_max_tournoi_colon")}</div>
                                </div>
                                <div className='is-flex-col'>
                                    <div className='is-flex gap-5'>
                                        {tFinaleSettings.sizes?.map((_, i) =>
                                            <div key={i} className='is-flex-col align-center gap-2'>
                                                <div>{t("tournoi.manche_nb", { nb: i + 1 })}</div>
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
                                <div className='has-text-right is-one-third'>{tTournamentSettings.useTeams ? t("tournoi.nb_equipes_par_groupe_colon") : t("tournoi.nb_joueurs_par_groupe_colon")}</div>
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
                                <div className='has-text-right is-one-third'>{t("tournoi.pts_par_victoire_colon")}</div>
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
                                <div className='has-text-right is-one-third'>{t("tournoi.pts_par_nul_colon")}</div>
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
                                <div className='has-text-right is-one-third'>{t("tournoi.matchs_AR_colon")}</div>
                                <div className='is-flex-col'>
                                    <CustomRadio variable={tFinaleSettings.meetTwice} setter={(v: boolean) => handleFinaleSettingsChange({ meetTwice: v })} items={[{ label: t("non"), value: false }, { label: t("oui"), value: true }]} />
                                    <div className='mx-3 is-size-7'>{tTournamentSettings.useTeams ? t("tournoi.matchs_AR_equipes_hint") : t("tournoi.matchs_AR_joueurs_hint")}</div>
                                </div>
                            </div>
                        </>
                        }
                    </>}
                    <div className='is-flex grow align-end justify-space-between'>
                        <CustomButton
                            callback={() => set_editStep(editStep - 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={[t("boutons.precedent")]}
                        />
                        <CustomButton
                            callback={() => set_editStep(editStep + 1)}
                            colorClass='has-background-primary-accent'
                            contentItems={[t("boutons.suivant")]}
                        />
                    </div>
                </>}
                {/* Comments */}
                {editStep == tournamentEditSteps.COMMENTS && <>
                    <div className='is-flex gap-3'>
                        <p className='has-text-right is-one-fifth'>{t("tournoi.commentaires_colon")}</p>
                        <div className='is-flex-col gap-2 is-three-fifths'>
                            <textarea placeholder={t("tournoi.commentaires")} value={tTournamentProperties.comments} onChange={(e) => { handlePropertiesChange({ comments: e.target.value }); }} rows={8} />
                            <div className='is-size-7'>{t("tournoi.commentaires_hint")}</div>
                        </div>
                    </div>
                    <div className='is-flex grow align-end justify-space-between'>
                        <CustomButton
                            callback={() => set_editStep(editStep - (runningTournament ? 3 : 1))}
                            colorClass='has-background-primary-accent'
                            contentItems={[t("boutons.precedent")]}
                        />
                        <CustomButton
                            callback={existingTournament ? UpdateTournament : PublishTournament}
                            colorClass='has-background-primary-accent'
                            contentItems={[t("boutons.publier")]}
                        />
                    </div>
                </>}
            </div>
        </div>
    )
}
