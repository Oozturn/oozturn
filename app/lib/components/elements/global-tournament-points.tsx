import { globalTournamentPoints } from "~/lib/types/lan"
import { MicroButton } from "./custom-button";

interface ShowGlobalTournamentPointsProps {
    points: globalTournamentPoints
}
export function ShowGlobalTournamentPoints({ points }: ShowGlobalTournamentPointsProps) {

    const leadersMap = getLeadersMap(points);
    const defaultPointRange = `${points.leaders.length <= 4 ? points.leaders.length + 1 : Math.pow(2, points.leaders.length - 2) + 1} et +`

    return <div className='globalTournamentOptions is-flex-row gap-1'>
        <div className='is-flex-col'>
            <div className='is-flex justify-end align-center'>Place :</div>
            <div className='is-flex justify-end align-center'>Points :</div>
        </div>
        {Array.from(leadersMap.entries()).map(([key, pts], index) =>
            <div key={index} className="rankPoints is-flex-col">
                <div className="has-text-weight-semibold is-flex justify-center align-center">{key}</div>
                <div className="is-flex justify-center align-center" style={{ minWidth: "2rem" }}>{pts}</div>
            </div>
        )}
        <div className="rankPoints is-flex-col">
            <div className="has-text-weight-semibold is-flex justify-center align-center">{defaultPointRange}</div>
            <div className="is-flex justify-center align-center" style={{ minWidth: "2rem" }}>{points.default}</div>
        </div>
    </div>
}

interface EditGlobalTournamentPointsProps {
    points: globalTournamentPoints
    updatePoints: (points: globalTournamentPoints) => void
}
export function EditGlobalTournamentPoints({ points, updatePoints }: EditGlobalTournamentPointsProps) {

    const leadersMap = getLeadersMap(points);
    const defaultPointRange = `${points.leaders.length <= 4 ? points.leaders.length + 1 : Math.pow(2, points.leaders.length - 2) + 1} et +`

    return <div className='globalTournamentOptions editing is-flex-row gap-3 '>
        <div className='is-flex-col'>
            <div className='is-flex justify-end align-center'>Place :</div>
            <div className='is-flex justify-end align-center'>Points :</div>
        </div>
        {Array.from(leadersMap.entries()).map(([key, pts], index) =>
            <div key={index} className="rankPoints is-flex-col align-center">
                <div className="has-text-weight-semibold is-flex justify-center align-center">{key}</div>
                <input
                    className="is-flex has-text-centered"
                    style={{ width: "3.5rem" }}
                    type="number"
                    placeholder={String(pts)}
                    value={String(pts)}
                    onChange={(e) => {
                        points.leaders[index] = Number(e.target.value)
                        updatePoints(points)
                    }}
                />
            </div>
        )}
        <div className="rankPoints is-flex-col">
            <div className="has-text-weight-semibold is-flex justify-center align-center">{defaultPointRange}</div>
            <input className="is-flex has-text-centered"
                style={{ width: "3.5rem" }}
                type="number"
                placeholder={String(points.default)}
                value={String(points.default)}
                onChange={(e) => {
                    points.default = Number(e.target.value)
                    updatePoints(points)
                }}
            />
        </div>
        <div className="is-flex-col justify-stretch has-background-primary-level" style={{padding: "2px", gap: "2px"}}>
            <MicroButton
                contentItems={["+"]}
                callback={() => {
                    addGlobalTournamentPointsRanks(points)
                    updatePoints(points)
                }}
                colorClass="has-background-primary-accent"
            />
            <MicroButton
                contentItems={["-"]}
                callback={() => {
                    removeGlobalTournamentPointsRanks(points)
                    updatePoints(points)
                }}
                colorClass="has-background-secondary-accent"
                active={points.leaders.length > 1}
            />
        </div>
    </div>
}

function getLeadersMap(points: globalTournamentPoints) {
    // Create a map of levels or ranges to show based on the point.leaders array
    const map = new Map<string, number>();
    points.leaders.forEach((pts, index) => {
        if (index < 4) {
            map.set((index + 1).toString(), pts);
        } else {
            // Calculate the start and end for each range based on index
            const rangeSize = Math.pow(2, index - 2);
            const start = rangeSize + 1;
            const end = rangeSize * 2;
            const key = `${start}-${end}`;
            map.set(key, pts);
        }
    });
    return map;
}

function addGlobalTournamentPointsRanks(points: globalTournamentPoints) {
    // add one level to globalTournamentPoints leaders.
    points.leaders.push(points.default)
}

function removeGlobalTournamentPointsRanks(points: globalTournamentPoints) {
    // remove one level to globalTournamentPoints leaders.
    if (points.leaders.length <= 1) return // Ensure at least one rank remains
    points.leaders.pop()
}