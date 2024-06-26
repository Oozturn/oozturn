import { Id } from "~/lib/tournamentEngine/tournament/match";
import { useUser } from "../contexts/UserContext";
import { useTournament } from "../contexts/TournamentsContext";
import { IdToString } from "~/lib/utils/tournaments";
import { FakeUserTileRectangle, UserTileRectangle } from "./user-tile";
import { useFetcher } from "@remix-run/react";
import { MatchesIntents } from "~/routes/tournaments.$id/route";
import { TournamentStatus } from "~/lib/tournamentEngine/types";

interface MatchTileProps {
    matchId: Id
}



export function MatchTile({ matchId }: MatchTileProps) {
    const user = useUser()
    const tournament = useTournament()
    const fetcher = useFetcher()

    const match = tournament.matches.find(match => match.id == matchId)
    if (!match) return null

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

    return (
        <div className="is-flex-col" style={{ width: 275 }}>
            <div>{IdToString(match.id)}</div>
            <div className="is-flex-col has-background-secondary-level p-1 gap-1">
                {match.opponents.map((opponent, index) => {
                    const canEditScore = match.scorable && ((user.id == opponent && tournament.status == TournamentStatus.Running) || (user.isAdmin && tournament.status != TournamentStatus.Done))
                    return <div key={IdToString(matchId) + '-' + String(index)} className="is-flex align-center justify-space-between gap-2">
                        {opponent != undefined ?
                            tournament.settings[0].useTeams ?
                                <FakeUserTileRectangle userName={opponent} initial={opponent[0]} maxLength={245} />
                                :
                                <UserTileRectangle userId={opponent} maxLength={245} />
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