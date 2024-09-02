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

export function TournamentViewer() {
    const tournament = useTournament()
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    const [minScale, setMinScale] = useState(0)
    const containerRef = useRef(null)
    const bracketRef = useRef(null)
    const [hightlightOpponent, setHightlightOpponent] = useState("")

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
                                <BracketViewer bracket={0} />
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
    </div>
}

function BracketViewer({ bracket }: { bracket: number }) {
    const tournament = useTournament()
    const matches = tournament.matches
    const sections = Array.from(new Set(matches.filter(match => match.bracket == bracket).map(match => match.id.s)))
    const showBracketName = Array.from(new Set(matches.map(match => match.bracket))).length > 1

    const wrapperContext = useTransformContext()

    useEffect(() => {
        if (wrapperContext.wrapperComponent && wrapperContext.contentComponent) {
            wrapperContext.init(wrapperContext.wrapperComponent, wrapperContext.contentComponent)
        }
    }, [wrapperContext, tournament.id])

    return (
        <div className="is-flex-col gap-5 no-basis has-background-secondar-level">
            {showBracketName && <div className="is-title big">Bracket {bracket}</div>}
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
    const settings = useTournament().settings[bracket]

    const sectionName = (() => {
        if (settings.type == BracketType.FFA) return ''
        if (section == 1) return 'Tableau Principal'
        if (settings.last == Duel.LB) return 'Rattrapage'
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
    const matches = useTournament().matches.filter(match => match.bracket == bracket && !match.isFinale && match.id.s == section && match.id.r == round)
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

    // const showHeaderAndPlace = tournament.settings[match.bracket].type == BracketType.FFA

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

    const getOpponentColorClass = (opponent: string) => {
        if (opponent == hightlightOpponent) return "has-text-primary-accent"
        if (!hightlightOpponent && (user.id == opponent || userTeam?.name == opponent)) return "has-text-primary-accent"
    }

    return (
        <div className="is-flex-row align-center" style={{ width: 275 }}>
            <div className="is-vertical is-flex pt-2" style={{ transform: "rotate(-90deg)", width: "2rem", lineHeight: "1rem" }}>{IdToString(match.id)}</div>
            <div className={`is-flex-col ${match.isFinale ? 'has-background-secondary-accent' : 'has-background-secondary-level'} grow p-1 gap-1`}>
                {match.opponents.map((opponent, index) => {

                    const canEditScore = match.scorable &&
                        (
                            (tournament.status == TournamentStatus.Running && (user.id == opponent || (userTeam && (user.id == userTeam.members[0]) && (userTeam.name == opponent))))
                            || (tournament.status != TournamentStatus.Done && user.isAdmin)
                        )

                    return <div key={IdToString(matchId) + '-' + String(index)} className="is-flex-row align-end justify-space-between gap-2" onMouseEnter={() => setHightlightOpponent(opponent || "")} onMouseLeave={() => setHightlightOpponent("")}>
                        {opponent != undefined ?
                            tournament.settings[0].useTeams ?
                                <FakeUserTileRectangle userName={opponent} initial={opponent[0]} maxLength={245} colorClass={getOpponentColorClass(opponent)} />
                                :
                                <UserTileRectangle userId={opponent} maxLength={245} showTeam={false} colorClass={getOpponentColorClass(opponent)} />
                            :
                            <FakeUserTileRectangle userName="Unknown" initial="?" maxLength={245} />
                        }
                        {canEditScore ?
                            <input type="number" name="score"
                                className="threeDigitsWidth has-text-centered"
                                defaultValue={match.score[index]}
                                onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                    score(matchId, opponent || "", Number(event.target.value))
                                }}
                            />
                            :
                            <div className="has-text-centered" style={{ width: "2.5rem" }}>{match.score[index] || ""}</div>
                        }
                    </div>
                })}
            </div>
        </div>
    )
}