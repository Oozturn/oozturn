import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { redirect, useLoaderData } from "@remix-run/react"
import { TournamentContext, useTournament } from "~/lib/components/contexts/TournamentsContext"
import { getLan } from "~/lib/persistence/lan.server"
import { getTournament } from "~/lib/persistence/tournaments.server"
import { BracketType, TournamentFullData, TournamentStatus } from "~/lib/tournamentEngine/types"
import { clickorkey } from "~/lib/utils/clickorkey"
import { useEffect, useState } from "react"
import { SectionViewer } from "../components/tournamentViewer"



export const meta: MetaFunction<typeof loader> = ({ data }) => {
    return [
        { title: data?.lanName + " - Bracket du tournoi " + data?.tournament.properties.name }
    ]
}

export async function loader({
    params,
}: LoaderFunctionArgs): Promise<{
    tournament: TournamentFullData
    lanName: string
}> {
    let tournament: TournamentFullData | undefined = undefined
    try {
        tournament = getTournament(params.id || "").getFullData()
    } catch { throw redirect('/tournaments/404') }

    if ([TournamentStatus.Open, TournamentStatus.Balancing].includes(tournament.status))
        throw redirect('/tournaments/' + tournament.id)
    return { tournament: tournament, lanName: getLan().name }
}

export default function TournamentBracket() {
    const { tournament } = useLoaderData<typeof loader>()
    const [currentBracketView, setCurrentBracketView] = useState(tournament.currentBracket)

    useEffect(() => {
        document.body.classList.add("is-relative")
        document.body.style.overflow = "unset"
        document.body.style.height = "unset"

        const mainDiv = document.getElementsByTagName("main")[0]
        mainDiv.style.height = "unset"
        mainDiv.classList.remove("is-clipped")
    })


    return <div className="p-4 is-relative">
        {tournament.bracketsCount == 2 &&
            <div className="is-flex-row justify-center gap-3 p-2" style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 2 }} >
                <div className={currentBracketView == 0 ? "has-text-weight-bold" : "fade-on-mouse-out is-clickable"} {...clickorkey(() => setCurrentBracketView(0))}>Poules</div>
                <div>|</div>
                <div className={currentBracketView == 0 ? "fade-on-mouse-out is-clickable" : "has-text-weight-bold"} {...clickorkey(() => setCurrentBracketView(1))}>Finale</div>
            </div>
        }
        <TournamentContext.Provider value={tournament}>
            <FullPageBracketViewer bracket={currentBracketView} />
        </TournamentContext.Provider>
    </div>
}


function FullPageBracketViewer({ bracket }: { bracket: number }) {
    const tournament = useTournament()
    const matches = tournament.matches.filter(match => match.bracket == bracket)
    const sections = Array.from(new Set(matches.map(match => match.id.s)))

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