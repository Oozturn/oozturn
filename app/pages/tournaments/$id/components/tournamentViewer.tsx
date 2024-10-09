import { IdToString } from "~/lib/utils/tournaments"
import { Fragment, useContext, useEffect, useRef, useState } from "react"
import { BracketType, TournamentStatus } from "~/lib/tournamentEngine/types"
import { Duel } from "~/lib/tournamentEngine/tournament/duel"
import { TransformComponent, TransformWrapper, useTransformContext } from "react-zoom-pan-pinch"
import { HightlightOpponentContext } from "./HightlightOpponentContext"
import { Id } from "~/lib/tournamentEngine/tournament/match"
import { useUser } from "~/lib/components/contexts/UserContext"
import { useFetcher } from "@remix-run/react"
import { MatchesIntents } from "../tournament"
import { FakeUserTileRectangle, UserTileRectangle } from "~/lib/components/elements/user-tile"
import { useTournament } from "~/lib/components/contexts/TournamentsContext"
import useLocalStorageState from "use-local-storage-state"
import { clickorkey } from "~/lib/utils/clickorkey"
import { FitSVG, PanSVG, ZoomInSVG, ZoomOutSVG } from "~/lib/components/data/svg-container"

export function TournamentViewer() {
    const tournament = useTournament()
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    const [minScale, setMinScale] = useState(0)
    const containerRef = useRef(null)
    const bracketRef = useRef(null)
    const [hightlightOpponent, setHightlightOpponent] = useState("")
    const [tournamentWideView, setTournamentWideView] = useLocalStorageState<string[]>("tournamentWideView", { defaultValue: [] })
    const [currentBracketView, setCurrentBracketView] = useState(tournament.currentBracket) //useState(new Map<string, number>(JSON.parse(tournamentSpecificBracketView)).get(tournament.id) || tournament.currentBracket)

    useEffect(() => {
        const ref = containerRef.current as unknown as HTMLDivElement
        const bref = bracketRef.current as unknown as HTMLDivElement
        setWidth(ref?.clientWidth)
        setHeight(ref?.clientHeight)
        setMinScale(
            Math.min(
                ref?.clientHeight / bref?.clientHeight,
                ref?.clientWidth / bref?.clientWidth,
                1
            ))
    }, [containerRef, bracketRef, minScale, tournament.id])


    useEffect(() => {
        if (hightlightOpponent == "") return
        const TeamInfosContainer = document.getElementById('TeamInfosContainer')
        const TeamInfos = document.getElementById('TeamInfos')
        if (!TeamInfosContainer || !TeamInfos) return
        TeamInfos.classList.remove('animateFromTopToBottom')
        if (TeamInfosContainer.offsetHeight < TeamInfos.offsetHeight) {
            TeamInfos.classList.add('animateFromTopToBottom')
            TeamInfos.style.setProperty('--dist', String(TeamInfosContainer.offsetHeight - TeamInfos.offsetHeight) + "px")
        }
    }, [hightlightOpponent])

    return <div className="is-flex grow no-basis has-background-primary-level p-4 is-relative">
        <div
            style={{ position: "absolute", top: 0, left: 0, zIndex: 3 }}
            className="is-clickable is-flex p-2 fade-on-mouse-out"
            {...clickorkey(() =>
                setTournamentWideView(tournamentWideView.includes(tournament.id) ? tournamentWideView.filter(s => s != tournament.id) : [...tournamentWideView, tournament.id])
            )}>
            {tournamentWideView.includes(tournament.id) ?
                <div className="is-flex align-center gap-1">
                    <FitSVG />
                    <p>Réduire</p>
                </div>
                :
                <div className="is-flex align-center gap-1">
                    <FitSVG />
                    <p>Agrandir</p>
                </div>
            }
        </div>
        {tournament.bracketsCount == 2 &&
            <div className="is-flex-row justify-center gap-3 p-2" style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 2 }} >
                <div className={currentBracketView == 0 ? "" : "fade-on-mouse-out is-clickable"} {...clickorkey(() => setCurrentBracketView(0))}>Poules</div>
                <div>|</div>
                <div className={currentBracketView == 0 ? "fade-on-mouse-out is-clickable" : ""} {...clickorkey(() => setCurrentBracketView(1))}>Finale</div>
            </div>
        }
        <HightlightOpponentContext.Provider value={{ hightlightOpponent: hightlightOpponent, setHightlightOpponent: setHightlightOpponent }} >
            <div ref={containerRef} className="is-flex grow no-basis">
                <TransformWrapper centerOnInit={true} initialScale={minScale ? minScale : 1} minScale={minScale ? minScale : .3} maxScale={1} panning={{ excluded: ["input"] }} doubleClick={{ disabled: true }} disablePadding={true}>
                    <TransformComponent
                        wrapperStyle={{ width: width ? width : "100%", height: height ? height : "100%" }}
                        wrapperClass="has-background-primary-level"
                        contentClass=""
                        contentStyle={{ whiteSpace: "nowrap" }}
                    >
                        {width ?
                            <div ref={bracketRef}>
                                <BracketViewer bracket={currentBracketView} />
                            </div>
                            :
                            null
                        }
                    </TransformComponent>
                </TransformWrapper>
            </div>
            {tournament.teams && tournament.teams.map(team => team?.name).includes(hightlightOpponent) &&
                <div id='TeamInfosContainer' className="TeamInfosContainer has-background-primary-level">
                    <div id='TeamInfos' className='is-flex-col p-4 gap-4 is-relative'>
                        <div className='is-title medium has-text-primary-accent'>Équipe {hightlightOpponent}</div>
                        <div className='pl-2 is-flex-col gap-1'>
                            {tournament.teams.find(team => team?.name == hightlightOpponent)?.members.map((player, index) =>
                                <Fragment key={player}>
                                    <UserTileRectangle isShiny={index == 0} userId={player} maxLength={245} showTeam={false} />
                                </Fragment>
                            )}
                        </div>
                    </div>
                </div>
            }
        </HightlightOpponentContext.Provider>
        <div
            style={{ position: "absolute", bottom: 0, left: 0, zIndex: 2 }}
            className='is-flex p-2 gap-3 fade-text is-unselectable'
        >
            <div className='is-flex align-center gap-1'>
                <div className="is-flex align-center"><ZoomInSVG />/<ZoomOutSVG /></div>
                <div>Molette</div>
            </div>
            <div className='is-flex align-center gap-1'>
                <PanSVG />
                <div>Cliquer-glisser</div>
            </div>
        </div>
    </div>
}

function BracketViewer({ bracket }: { bracket: number }) {
    const tournament = useTournament()
    const matches = tournament.matches
    const sections = Array.from(new Set(matches.filter(match => match.bracket == bracket).map(match => match.id.s)))

    const wrapperContext = useTransformContext()

    useEffect(() => {
        if (wrapperContext.wrapperComponent && wrapperContext.contentComponent) {
            wrapperContext.init(wrapperContext.wrapperComponent, wrapperContext.contentComponent)
        }
    }, [wrapperContext, tournament.id])

    return (
        <div className="is-flex-col gap-5 no-basis has-background-secondar-level">
            {sections.map(section => {
                return (
                    <Fragment key={bracket + '.' + section}>
                        <SectionViewer bracket={bracket} section={section} />
                    </Fragment>
                )
            })}
        </div>
    )
}

function SectionViewer({ bracket, section }: { bracket: number, section: number }) {
    const matches = useTournament().matches
    const rounds = Array.from(new Set(matches.filter(match => match.bracket == bracket && match.id.s == section).map(match => match.id.r)))
    const showSectionName = Array.from(new Set(matches.filter(match => match.bracket == bracket).map(match => match.id.s))).length > 1
    const tournament = useTournament()

    const sectionName = (() => {
        if (tournament.bracketsCount == 2 && bracket == 0) return 'Poule ' + section
        if (tournament.bracketSettings[bracket].type == BracketType.FFA) return ''
        if (tournament.bracketSettings[bracket].type == BracketType.GroupStage) return 'Poule ' + section
        if (section == Duel.WB) return 'Tableau Principal'
        if (tournament.bracketSettings[bracket].last == Duel.LB) return 'Rattrapage'
        return 'Petite finale'
    })()

    return (
        <div className="is-flex-col gap-1">
            {showSectionName && <div className="is-title medium">{sectionName}</div>}
            <div className="is-flex-row gap-3 align-stretch">
                {rounds.map(round => {
                    return (
                        <Fragment key={bracket + '.' + section + '.' + round}>
                            <RoundViewer bracket={bracket} section={section} round={round} />
                        </Fragment>
                    )
                })}
                {section == 1 && <FinaleViewer bracket={bracket} />}
            </div>
        </div>
    )
}

function RoundViewer({ bracket, section, round }: { bracket: number, section: number, round: number }) {
    const matches = useTournament().matches.filter(match =>
        match.bracket == bracket
        && !match.isFinale
        && match.id.s == section
        && match.id.r == round
    )
    if (!matches.length) return null
    return (
        <div className="is-flex-col gap-5 justify-space-around">
            {matches.map(match =>
                <Fragment key={bracket + '.' + IdToString(match.id)}>
                    <MatchTile matchId={match.id} />
                </Fragment>
            )}
        </div>
    )
}

function FinaleViewer({ bracket }: { bracket: number }) {
    const matches = useTournament().matches.filter(match => match.bracket == bracket && match.isFinale)
    if (matches.length == 0) return null

    return (
        <div className="is-flex-col gap-1 justify-center">
            <div className="is-flex-row gap-3 justify-space-around is-relative">
                <div className="pr-5 is-title medium" style={{ position: "absolute", left: "2rem", top: "-2.5rem" }}>Finale</div>
                {matches.map(match =>
                    <Fragment key={bracket + '.' + IdToString(match.id)}>
                        <MatchTile matchId={match.id} />
                    </Fragment>
                )}
            </div></div>
    )
}


function MatchTile({ matchId }: { matchId: Id }) {
    const user = useUser()
    const tournament = useTournament()
    const fetcher = useFetcher()
    const { hightlightOpponent, setHightlightOpponent } = useContext(HightlightOpponentContext)

    const userTeam = tournament.teams.find(team => team.members.includes(user.id))

    const match = tournament.matches.find(match => match.id == matchId)
    if (!match) return null

    const isFFA = tournament.bracketSettings[match.bracket].type == BracketType.FFA
    const isOver = match.score.every(score => score != undefined)
    const qualifiedPlaces = function () {
        if (isFFA) {
            if (tournament.bracketsCount == 2 && match.bracket == 0)
                return (tournament.bracketSettings[1].size || 1) / (tournament.matches.filter(m => m.bracket == 0).length || 1)
        }
        return (tournament.bracketSettings[match.bracket].advancers || [])[match.id.r - 1] || 1
    }()

    console.log(qualifiedPlaces)

    const score = (mId: Id, opponent: string, score: number) => {
        fetcher.submit(
            {
                intent: MatchesIntents.SCORE,
                tournamentId: tournament?.id || "",
                matchID: IdToString(mId),
                opponent: opponent,
                score: score
            },
            { method: "POST", encType: "application/json" }
        )
    }

    const matchOpponents = match.opponents.map((opponentId, index) => {
        return { opponentId: opponentId, opponentScore: match.score[index] }
    })

    if (isOver) {
        if (tournament.bracketSettings[match.bracket].lowerScoreIsBetter)
            matchOpponents.sort((a, b) => a.opponentScore! - b.opponentScore!)
        else
            matchOpponents.sort((a, b) => b.opponentScore! - a.opponentScore!)
    }

    const getOpponentColorClass = (opponent: string) => {
        if (opponent == hightlightOpponent) return "has-text-primary-accent"
        if (!hightlightOpponent && (user.id == opponent || userTeam?.name == opponent)) return "has-text-primary-accent"
    }

    return (
        <div className="is-flex-row align-center" style={{ width: isFFA ? 339 : 275 }}>
            <div className="is-vertical is-flex pt-2" style={{ transform: "rotate(-90deg)", width: "2rem", lineHeight: "1rem" }}>{IdToString(match.id)}</div>
            <div className={`is-flex-col ${match.isFinale ? 'has-background-secondary-accent' : 'has-background-secondary-level'} grow p-1 gap-1`}>
                {isFFA &&
                    <div className="is-flex gap-2 justify-end">
                        <p className="threeDigitsWidth">Pts</p>
                        <p className="threeDigitsWidth">Pos</p>
                    </div>
                }
                {matchOpponents.map(({ opponentId, opponentScore }, index) => {

                    const canEditScore = match.scorable &&
                        (
                            (tournament.status == TournamentStatus.Running && (user.id == opponentId || (userTeam && (user.id == userTeam.members[0]) && (userTeam.name == opponentId))))
                            || (tournament.status != TournamentStatus.Done && user.isAdmin)
                        )

                    return <div key={IdToString(matchId) + '-' + opponentId + '-' + String(index)} className="is-flex-row align-end justify-space-between gap-2" onMouseEnter={() => setHightlightOpponent(opponentId || "")} onMouseLeave={() => setHightlightOpponent("")}>
                        {opponentId != undefined ?
                            tournament.settings.useTeams ?
                                <FakeUserTileRectangle userName={opponentId} initial={opponentId[0]} maxLength={245} colorClass={getOpponentColorClass(opponentId)} />
                                :
                                <UserTileRectangle userId={opponentId} maxLength={245} showTeam={false} colorClass={getOpponentColorClass(opponentId)} />
                            :
                            <FakeUserTileRectangle userName="Unknown" initial="?" maxLength={245} />
                        }
                        {canEditScore ?
                            <input type="number" name="score"
                                className="threeDigitsWidth has-text-centered"
                                defaultValue={opponentScore}
                                onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                    score(matchId, opponentId || "", Number(event.target.value))
                                }}
                            />
                            :
                            <div className="has-text-centered" style={{ width: "2.5rem" }}>{opponentScore != undefined ? opponentScore : ""}</div>
                        }
                        {isFFA &&
                            <div className={`threeDigitsWidth has-text-centered ${index < Math.floor(qualifiedPlaces) ? "has-text-primary-accent" : index < Math.ceil(qualifiedPlaces) ? "has-text-secondary-accent" : ""}`}>{isOver ? index + 1 : "?"}</div>
                        }
                    </div>
                })}
            </div>
        </div>
    )
}