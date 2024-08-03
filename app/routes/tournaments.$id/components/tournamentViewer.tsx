import { IdToString } from "~/lib/utils/tournaments"
import { useTournament } from "../../../lib/components/contexts/TournamentsContext"
import { MatchTile } from "../../../lib/components/elements/bracket-elements"
import { Fragment, useEffect, useRef, useState } from "react"
import { BracketType } from "~/lib/tournamentEngine/types"
import { Duel } from "~/lib/tournamentEngine/tournament/duel"
import { TransformComponent, TransformWrapper, useTransformContext } from "react-zoom-pan-pinch"

export function TournamentViewer() {
    const tournament = useTournament()
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    const [minScale, setMinScale] = useState(0)
    const containerRef = useRef(null)
    const bracketRef = useRef(null)

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

    return <div className="is-flex grow no-basis has-background-primary-level p-4">
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