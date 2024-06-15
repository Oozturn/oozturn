import { useFetcher } from "@remix-run/react";
import { globalTournamentPoints } from "~/lib/types/lan";
import { AdminIntents } from "~/routes/admin/route";

interface ShowGlobalTournamentPointsProps {
    points: globalTournamentPoints
}
export function ShowGlobalTournamentPoints({ points }: ShowGlobalTournamentPointsProps) {
    return <div className='globalTournamentOptions is-flex-row gap-1'>
        <div className='is-flex-col'>
            <div className='is-flex justify-end align-center'>Place :</div>
            <div className='is-flex justify-end align-center'>Points :</div>
        </div>
        {points.leaders.map((points, index) =>
            <div key={index} className="rankPoints is-flex-col">
                <div className="has-text-weight-semibold is-flex justify-center align-center">{index + 1}</div>
                <div className="is-flex justify-center align-center" style={{ minWidth: "2rem" }}>{points}</div>
            </div>
        )}
        <div className="rankPoints is-flex-col">
            <div className="has-text-weight-semibold is-flex justify-center align-center">5 et +</div>
            <div className="is-flex justify-center align-center" style={{ minWidth: "2rem" }}>{points.default}</div>
        </div>
    </div>
}

interface EditGlobalTournamentPointsProps {
    points: globalTournamentPoints
    updatePoints: (points: globalTournamentPoints) => void
}
export function EditGlobalTournamentPoints({ points, updatePoints }: EditGlobalTournamentPointsProps) {
    return <div className='globalTournamentOptions editing is-flex-row gap-1'>
        <div className='is-flex-col'>
            <div className='is-flex justify-end align-center'>Place :</div>
            <div className='is-flex justify-end align-center'>Points :</div>
        </div>
        {points.leaders.map((pts, index) =>
            <div key={index} className="rankPoints is-flex-col">
                <div className="has-text-weight-semibold is-flex justify-center align-center">{index + 1}</div>
                <input
                    className="is-flex has-text-centered"
                    style={{ width: "3.5rem" }}
                    type="text"
                    placeholder={String(pts)}
                    value={String(pts)}
                    onChange={(e) => {
                        if (!e.target.value) return
                        points.leaders[index] = Number(e.target.value)
                        updatePoints(points)
                    }}
                />
            </div>
        )}
        <div className="rankPoints is-flex-col">
            <div className="has-text-weight-semibold is-flex justify-center align-center">5 et +</div>
            <input className="is-flex has-text-centered"
                style={{ width: "3.5rem" }}
                type="text"
                placeholder={String(points.default)}
                value={String(points.default)}
                onChange={(e) => {
                    if (!e.target.value) return
                    points.default = Number(e.target.value)
                    updatePoints(points)
                }}
            />
        </div>
    </div>
}