import { canEditScore, IdToString } from "~/lib/utils/tournaments"
import { useContext, useEffect, useRef, useState } from "react"
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
import { FitSVG, GroupSVG, MapPinSVG, PanSVG, ZoomInSVG, ZoomOutSVG } from "~/lib/components/data/svg-container"
import { range } from "~/lib/utils/ranges"
import { DebouncedInputNumber } from "~/lib/components/elements/debounced-input"
import { useUsers } from "~/lib/components/contexts/UsersContext"
import { useSettings } from "~/lib/components/contexts/SettingsContext"

export function TournamentViewer() {
    const tournament = useTournament()
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    const [minScale, setMinScale] = useState(0)
    const containerRef = useRef(null)
    const bracketRef = useRef(null)
    const [hightlightOpponent, setHightlightOpponent] = useState("")
    const [tournamentWideView, setTournamentWideView] = useLocalStorageState<string[]>("tournamentWideView", { defaultValue: [] })
    const [currentBracketView, setCurrentBracketView] = useState(tournament.currentBracket)

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
        setCurrentBracketView(tournament.currentBracket)
    }, [containerRef, bracketRef, minScale, tournament.id, tournament.currentBracket])


    useEffect(() => {
        if (hightlightOpponent == "") return
        const OpponentInfosContainer = document.getElementById('OpponentInfosContainer')
        const OpponentInfos = document.getElementById('OpponentInfos')
        if (!OpponentInfosContainer || !OpponentInfos) return
        OpponentInfos.classList.remove('animateFromTopToBottom')
        if (OpponentInfosContainer.offsetHeight < OpponentInfos.offsetHeight) {
            OpponentInfos.classList.add('animateFromTopToBottom')
            OpponentInfos.style.setProperty('--dist', String(OpponentInfosContainer.offsetHeight - OpponentInfos.offsetHeight) + "px")
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
                <div className={currentBracketView == 0 ? "has-text-weight-bold" : "fade-on-mouse-out is-clickable"} {...clickorkey(() => setCurrentBracketView(0))}>Poules</div>
                <div>|</div>
                <div className={currentBracketView == 0 ? "fade-on-mouse-out is-clickable" : "has-text-weight-bold"} {...clickorkey(() => setCurrentBracketView(1))}>Finale</div>
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
                                <BracketViewer bracket={currentBracketView <= tournament.bracketsCount - 1 ? currentBracketView : 0} />
                            </div>
                            :
                            null
                        }
                    </TransformComponent>
                </TransformWrapper>
            </div>
            {tournament.settings.useTeams ?
                (tournament.teams && tournament.teams.map(team => team?.name).includes(hightlightOpponent) &&
                    <div id='OpponentInfosContainer' className="OpponentInfosContainer has-background-primary-level">
                        <div id='OpponentInfos' className='is-flex-col p-4 gap-4 is-relative'>
                            <div className='is-title medium has-text-primary-accent'>Équipe {hightlightOpponent}</div>
                            <div className='pl-2 is-flex-col gap-1'>
                                {tournament.teams.find(team => team?.name == hightlightOpponent)?.members.map((player, index) =>
                                    <UserTileRectangle key={player} isShiny={index == 0} userId={player} maxLength={245} showTeam={false} isForfeit={tournament.players.find(p => p.userId == player)?.isForfeit} />
                                )}
                            </div>
                        </div>
                    </div>
                )
                :
                (hightlightOpponent && tournament.players.filter(player => player?.userId == hightlightOpponent).map(player => {
                    const user = useUsers().find(user => user.id == player.userId)
                    if (!user) return null
                    return <div key={user.id} id='OpponentInfosContainer' className="OpponentInfosContainer has-background-primary-level">
                        <div id='OpponentInfos' className='is-flex-col p-4 gap-4 is-relative'>
                            <div className='is-title medium has-text-primary-accent'>{user.username}</div>
                            <div className='pl-2 is-flex-col gap-1'>
                                <div className="is-flex align-center gap-2"><GroupSVG />{user.team ? user.team : "Solo"}</div>
                                <div className="is-flex align-center gap-2"><MapPinSVG /> {user.seat ? user.seat : "Not set"}</div>
                            </div>
                        </div>
                    </div>
                }))
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
    const matches = tournament.matches.filter(match => match.bracket == bracket)
    const sections = Array.from(new Set(matches.map(match => match.id.s)))

    const wrapperContext = useTransformContext()

    useEffect(() => {
        if (wrapperContext.wrapperComponent && wrapperContext.contentComponent) {
            wrapperContext.init(wrapperContext.wrapperComponent, wrapperContext.contentComponent)
        }
    }, [wrapperContext, tournament.id])

    return (
        <div className={`is-flex-${tournament.bracketSettings[bracket].type == BracketType.GroupStage ? "row" : "col"} gap-5 no-basis has-background-secondar-level`} style={{ margin: "2rem" }}>
            {sections.map(section => {
                return (
                    <SectionViewer key={bracket + '.' + section} bracket={bracket} section={section} />
                )
            })}
        </div>
    )
}

function SectionViewer({ bracket, section }: { bracket: number, section: number }) {
    const tournament = useTournament()
    if (tournament.bracketSettings[bracket].type == BracketType.GroupStage) {
        return <GroupStageSectionViewer bracket={bracket} section={section} />
    }

    const matches = tournament.matches.filter(match => match.bracket == bracket && match.id.s == section)
    const rounds = Array.from(new Set(matches.map(match => match.id.r)))

    const sectionName = (() => {
        if (tournament.bracketsCount == 2 && bracket == 0) return 'Poule ' + section
        if (tournament.bracketSettings[bracket].type == BracketType.FFA) return ''
        if (section == Duel.WB) return 'Tableau Principal'
        if (tournament.bracketSettings[bracket].last == Duel.LB) return 'Rattrapage'
        return 'Petite finale'
    })()

    return (
        <div className="is-flex-col gap-1">
            <div className="is-title medium">{sectionName}</div>
            <div className="is-flex-row gap-3 align-stretch">
                {rounds.map(round => {
                    return (
                        <RoundViewer key={bracket + '.' + section + '.' + round} bracket={bracket} section={section} round={round} />
                    )
                })}
                {section == 1 && <FinaleViewer bracket={bracket} />}
            </div>
        </div>
    )
}

function GroupStageSectionViewer({ bracket, section }: { bracket: number, section: number }) {
    const tournament = useTournament()
    const matches = useTournament().matches.filter(match => match.bracket == bracket && match.id.s == section)
    const user = useUser()
    const { hightlightOpponent, setHightlightOpponent } = useContext(HightlightOpponentContext)

    const players = new Set<string>()
    matches.flatMap(m => m.opponents).forEach(opponent => opponent && players.add(opponent))
    const userTeam = tournament.teams.find(team => team.members.includes(user.id))

    const results = tournament.bracketsResults && tournament.bracketsResults[bracket].filter(res => players.has(res.id))

    const getOpponentColorClass = (opponent: string) => {
        if (opponent == hightlightOpponent) return "has-text-primary-accent"
        if (!hightlightOpponent && (user.id == opponent || userTeam?.name == opponent)) return "has-text-primary-accent"
    }

    const meetTwice = !!tournament.bracketSettings[bracket].meetTwice

    const getScore = ({ wins, draws }: { wins: number, draws?: number }) => {
        return (tournament.bracketSettings[bracket].winPoints || 3) * wins + (tournament.bracketSettings[bracket].tiePoints || 1) * (draws || 0)
    }
    const qualifiedPlayers = function () {
        const qPlayers: string[] = []
        if (tournament.bracketsCount == 2 && bracket == 0) {
            tournament.matches.filter(m => m.bracket == 1).flatMap(m => m.opponents).forEach(opponent => {
                if (!opponent) return
                if (tournament.settings.useTeams) {
                    tournament.teams.find(t => t.name == opponent)?.members.forEach(member => qPlayers.push(member))
                    return
                }
                qPlayers.push(opponent)
            })
        }
        return qPlayers
    }()

    return (
        <div className="is-flex-col gap-5 align-center">
            <div className="is-title medium">Poule {section}</div>
            {results && <div className="is-flex-row has-background-secondary-level gap-3 p-1 has-text-centered mb-5">
                <div className="is-flex-col gap-1" style={{ width: 245 }}>
                    <div className="has-text-weight-semibold mb-2">Joueurs</div>
                    {results.map(res => <div key={"id_" + res.id} onMouseEnter={() => setHightlightOpponent(res.id || "")} onMouseLeave={() => setHightlightOpponent("")}>{tournament.settings.useTeams ?
                        <FakeUserTileRectangle userName={res.id} height={32} initial={res.id[0]} maxLength={245} colorClass={getOpponentColorClass(res.id)} />
                        :
                        <UserTileRectangle userId={res.id} height={32} maxLength={245} showTeam={false} colorClass={getOpponentColorClass(res.id)} />
                    }</div>)}
                </div>
                <div className="is-flex-col gap-1">
                    <div className="has-text-weight-semibold mb-2">V</div>
                    {results.map(res => <div key={"v_" + res.id} style={{ height: 32 }} onMouseEnter={() => setHightlightOpponent(res.id || "")} onMouseLeave={() => setHightlightOpponent("")}>{res.wins}</div>)}
                </div>
                <div className="is-flex-col gap-1">
                    <div className="has-text-weight-semibold mb-2">N</div>
                    {results.map(res => <div key={"v_" + res.id} style={{ height: 32 }} onMouseEnter={() => setHightlightOpponent(res.id || "")} onMouseLeave={() => setHightlightOpponent("")}>{res.draws || 0}</div>)}
                </div>
                <div className="is-flex-col gap-1">
                    <div className="has-text-weight-semibold mb-2">D</div>
                    {results.map(res => <div key={"v_" + res.id} style={{ height: 32 }} onMouseEnter={() => setHightlightOpponent(res.id || "")} onMouseLeave={() => setHightlightOpponent("")}>{res.losses || 0}</div>)}
                </div>
                <div className="has-background-grey mb-1 mt-4" style={{ width: 2 }}></div>
                <div className="is-flex-col gap-1">
                    <div className="has-text-weight-semibold mb-2">Score</div>
                    {results.map(res => <div key={"v_" + res.id} style={{ height: 32 }} onMouseEnter={() => setHightlightOpponent(res.id || "")} onMouseLeave={() => setHightlightOpponent("")}>{getScore(res)}</div>)}
                </div>
                <div className="is-flex-col gap-1">
                    <div className="has-text-weight-semibold mb-2">Place</div>
                    {results.map((res, i) => <div key={"v_" + res.id} style={{ height: 32 }} className={
                        ((tournament.bracketsCount == 2 && bracket == 0) ?
                            qualifiedPlayers.includes(res.id || "")
                            : (res.pos == 1)) ? "has-text-primary-accent" : ""
                    } onMouseEnter={() => setHightlightOpponent(res.id || "")} onMouseLeave={() => setHightlightOpponent("")}>{i + 1}</div>)}
                </div>
            </div>}
            <div className="is-flex-col gap-3 align-stretch">
                {range(0, matches.length - 1, meetTwice ? 2 : 1).map(i => {
                    return <GroupStageMatchTile key={i} matchIds={matches.map(m => m.id).slice(i, i + (meetTwice ? 2 : 1))} />
                })}
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
                <MatchTile key={bracket + '.' + IdToString(match.id)} matchId={match.id} />
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
                    <MatchTile key={bracket + '.' + IdToString(match.id)} matchId={match.id} />
                )}
            </div></div>
    )
}


function MatchTile({ matchId }: { matchId: Id }) {
    const user = useUser()
    const tournament = useTournament()
    const fetcher = useFetcher()
    const { hightlightOpponent, setHightlightOpponent } = useContext(HightlightOpponentContext)
    const settings = useSettings()
    const [errors, setErrors] = useState<{ matchID: string, opponent: string }[]>([])

    const fetcherData = fetcher.data as { error?: string, type?: MatchesIntents, matchID?: string, opponent?: string } | undefined

    useEffect(() => {
        if (!fetcherData || fetcherData.type != MatchesIntents.SCORE || !fetcherData.matchID || !fetcherData.opponent) return
        if (fetcherData.error) {
            if(!errors.some(e => e.matchID == fetcherData.matchID && e.opponent == fetcherData.opponent)) {
                setErrors([...errors, { matchID: fetcherData.matchID, opponent: fetcherData.opponent }])
            }
        } else {
            setErrors(errors.filter(e => !(e.matchID == fetcherData.matchID && e.opponent == fetcherData.opponent)))
        }
    }, [fetcherData])


    const ffOpponentsIds = [...tournament.players.filter(p => p.isForfeit).map(p => p.userId), ...tournament.teams.filter(t => t.isForfeit).map(t => t.name)]
    const userTeam = tournament.teams.find(team => team.members.includes(user.id))

    const match = tournament.matches.find(match => match.id == matchId)
    if (!match) return null

    const isFFA = tournament.bracketSettings[match.bracket].type == BracketType.FFA
    const isOver = match.score.every(score => score != undefined)
    const qualifiedPlaces = function () {
        return (tournament.bracketSettings[match.bracket].advancers || [])[match.id.r - 1] || 1
    }()
    const qualifiedPlayers = function () {
        const qPlayers: string[] = []
        if (tournament.bracketsCount == 2 && match.bracket == 0) {
            tournament.matches.filter(m => m.bracket == 1).flatMap(m => m.opponents).forEach(opponent => {
                if (!opponent) return
                if (tournament.settings.useTeams) {
                    tournament.teams.find(t => t.name == opponent)?.members.forEach(member => qPlayers.push(member))
                    return
                }
                qPlayers.push(opponent)
            })
        }
        return qPlayers
    }()

    const score = (mId: Id, opponent: string, score: number | undefined) => {
        fetcher.submit(
            {
                intent: MatchesIntents.SCORE,
                tournamentId: tournament?.id || "",
                matchID: IdToString(mId),
                opponent: opponent,
                score: score === undefined ? null : score
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

    const isMatchEditable = matchOpponents.every(opponent => canEditScore(match, opponent.opponentId, tournament, user, settings.security.allOpponentsScore))
    const isMatchOver = match.score.every(score => score != undefined)
    const isMatchUnavailable = !isMatchOver && !match.scorable
    const matchTileAccent = (() => {
        if (tournament.status == TournamentStatus.Done) return ''
        if (isMatchOver) return 'has-background-primary-level has-borders-secondary-level'
        if (isMatchUnavailable) return 'fade-text'
        if (isMatchEditable && !user.isAdmin) return 'has-borders-primary-accent'
        return ''
    })()

    return (
        <div className="is-flex-row align-center" style={{ width: isFFA ? 394 : 330 }}>
            <div className="is-vertical is-flex pt-2" style={{ transform: "rotate(-90deg)", width: "2rem", lineHeight: "1rem" }}>{IdToString(match.id)}</div>
            <div className={`is-flex-col ${match.isFinale ? 'has-background-secondary-accent' : 'has-background-secondary-level'} ${matchTileAccent} grow p-1 gap-1`}>
                {isFFA &&
                    <div className="is-flex gap-2 justify-end">
                        <p className="threeDigitsWidth">Pts</p>
                        <p className="threeDigitsWidth">Pos</p>
                    </div>
                }
                {matchOpponents.map(({ opponentId, opponentScore }, index) => {

                    return <div key={IdToString(matchId) + '-' + opponentId + '-' + String(index)} className="is-flex-row align-end justify-space-between gap-2" onMouseEnter={() => setHightlightOpponent(opponentId || "")} onMouseLeave={() => setHightlightOpponent("")}>
                        {opponentId != undefined ?
                            tournament.settings.useTeams ?
                                <FakeUserTileRectangle userName={opponentId} initial={opponentId[0]} maxLength={245} colorClass={getOpponentColorClass(opponentId)} />
                                :
                                <UserTileRectangle userId={opponentId} maxLength={245} showTeam={false} colorClass={getOpponentColorClass(opponentId)} />
                            :
                            <FakeUserTileRectangle userName="Unknown" initial="?" maxLength={245} />
                        }
                        {canEditScore(match, opponentId, tournament, user, settings.security.allOpponentsScore) && !ffOpponentsIds.includes(opponentId!) ?
                            <DebouncedInputNumber name="score"
                                className={`threeDigitsWidth has-text-centered ${isMatchOver ? 'has-background-secondary-level' : ''}`}
                                defaultValue={opponentScore}
                                setter={(v: number | undefined) => { score(matchId, opponentId || "", v) }}
                                debounceTimeout={3000}
                                error={errors.some(e => e.matchID == IdToString(matchId) && e.opponent == opponentId)}
                            />
                            :
                            <div className="has-text-centered" style={{ width: "2.5rem" }}>{ffOpponentsIds.includes(opponentId!) ? "F" : opponentScore != undefined ? opponentScore : ""}</div>
                        }
                        {isFFA &&
                            <div className={`threeDigitsWidth has-text-centered ${((tournament.bracketsCount == 2 && match.bracket == 0) ?
                                qualifiedPlayers.includes(opponentId || "")
                                : index < Math.floor(qualifiedPlaces)) ? "has-text-primary-accent" : ""
                                }`}>{isOver ? index + 1 : "?"}</div>
                        }
                    </div>
                })}
            </div>
        </div>
    )
}
function GroupStageMatchTile({ matchIds }: { matchIds: Id[] }) {
    const user = useUser()
    const tournament = useTournament()
    const fetcher = useFetcher()
    const { hightlightOpponent, setHightlightOpponent } = useContext(HightlightOpponentContext)
    const settings = useSettings()

    const score = (mId: Id, opponent: string, score: number | undefined) => {
        fetcher.submit(
            {
                intent: MatchesIntents.SCORE,
                tournamentId: tournament?.id || "",
                matchID: IdToString(mId),
                opponent: opponent,
                score: score === undefined ? null : score
            },
            { method: "POST", encType: "application/json", action: "/tournaments/" + tournament.id }
        )
    }

    const ffOpponentsIds = [...tournament.players.filter(p => p.isForfeit).map(p => p.userId), ...tournament.teams.filter(t => t.isForfeit).map(t => t.name)]
    const userTeam = tournament.teams.find(team => team.members.includes(user.id))

    const matches = matchIds.map(id => tournament.matches.find(match => match.id == id))
    if (!matches.every(m => m != undefined)) return null

    const getOpponentColorClass = (opponent: string) => {
        if (opponent == hightlightOpponent) return "has-text-primary-accent"
        if (!hightlightOpponent && (user.id == opponent || userTeam?.name == opponent)) return "has-text-primary-accent"
    }

    return (
        <div className="is-flex-row gap-2 align-end has-background-secondary-level has-text-centered">
            <div className="is-flex-col grow p-1 gap-1">
                {matches.length > 1 && <div className="has-text-weight-semibold mb-2 has-text-right">Manches</div>}
                {matches[0]?.opponents.map(opponentId => {
                    if (!opponentId) return null
                    return (<div key={opponentId} onMouseEnter={() => setHightlightOpponent(opponentId || "")} onMouseLeave={() => setHightlightOpponent("")}>
                        {tournament.settings.useTeams ?
                            <FakeUserTileRectangle userName={opponentId} initial={opponentId[0]} maxLength={245} colorClass={getOpponentColorClass(opponentId)} />
                            :
                            <UserTileRectangle userId={opponentId} maxLength={245} showTeam={false} colorClass={getOpponentColorClass(opponentId)} />
                        }
                    </div>)
                })}
            </div>
            {matches.map((match, round) => {
                if (!match) return null // tsc thinks match can be undefined
                const isReturn = (tournament.bracketSettings[match.bracket].meetTwice == true) && (round % 2 == 1)
                const mScore = match.score.slice()
                if (isReturn)
                    mScore.reverse()
                return <div key={IdToString(match.id)} className="is-flex-col p-1 gap-1">
                    {matches.length > 1 && <div className="has-text-weight-semibold mb-2">{round + 1}</div>}
                    {mScore.map((opponentScore, index) => {

                        const opponentId = isReturn ? match.opponents.slice().reverse()[index] : match.opponents[index]

                        return <div key={IdToString(match.id) + '-' + String(index)} className="is-flex-row align-end justify-space-between gap-2" onMouseEnter={() => setHightlightOpponent(opponentId || "")} onMouseLeave={() => setHightlightOpponent("")}>
                            {canEditScore(match, opponentId, tournament, user, settings.security.allOpponentsScore) && !ffOpponentsIds.includes(opponentId!) ?
                                <DebouncedInputNumber name="score"
                                    className="threeDigitsWidth has-text-centered"
                                    defaultValue={opponentScore}
                                    setter={(v: number | undefined) => { score(match.id, opponentId || "", v) }}
                                    debounceTimeout={3000}
                                    error={false}
                                />
                                :
                                <div className={`has-text-centered ${opponentScore != undefined ? "" : "fade-on-mouse-out"}`} style={{ width: "2.5rem", height: 32 }}>{opponentScore != undefined ? ffOpponentsIds.includes(opponentId!) ? "F" : opponentScore : "?"}</div>
                            }
                        </div>
                    })}
                </div>

            })}
        </div>
    )
}