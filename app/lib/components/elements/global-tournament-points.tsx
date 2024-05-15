import { globalTournamentPoints } from "~/lib/types/tournaments";

interface showGlobalTournamentPointsProps {
    points: globalTournamentPoints
}
export function ShowGlobalTournamentPoints({ points }: showGlobalTournamentPointsProps) {
    return <div className='mb-3 globalTournamentOptions'>
        <div className='mb-3'>Points gagnés pour ce tournoi :</div>
        <div className='is-flex is-flex-wrap-wrap topRanksPoints pl-6 is-size-5'>
            <div className='rankPoints is-flex-col mr-4'>
                <div className='rank has-text-right has-text-weight-normal'>Place :</div>
                <div className='points has-text-right'>Points :</div>
            </div>
            {points.leaders.map((points, index) =>
                <div key={index} className="rankPoints is-flex-col">
                    <div className="rank is-flex is-justify-content-center is-align-items-center">{index + 1}</div>
                    <div className="points">{points}</div>
                </div>
            )}
            <div className="rankPoints is-flex-col">
                <div className="rank is-flex is-justify-content-center is-align-items-center">5 et +</div>
                <div className="points">{points.default}</div>
            </div>
        </div>
    </div>
}
/*
export function EditGlobalTournamentPoints() {
    return <div className='globalTournamentOptions is-flex is-flex-wrap-wrap gap-2'>
        <div className='rankPoints is-flex-col mr-4 gap-2'>
            <div className='rank has-text-right has-text-weight-normal'>Place :</div>
            <div className='points has-text-right'>Points :</div>
        </div>
        {lan.globalTournamentDefaultPoints.leaders.map((points, index) =>
            <div key={index} className="rankPoints is-flex-col">
                <div className="rank is-flex is-justify-content-center is-align-items-center">{index + 1}</div>
                <input className="points" type="text" placeholder={String(points)} value={String(points)} onChange={(e) => updateTopRanks(e.target.value, index)}></input>
            </div>
        )}
        <div className="rankPoints is-flex-col">
            <div className="rank is-flex is-justify-content-center is-align-items-center">5 et +</div>
            <input className="points" type="text" placeholder={String(lan.globalTournamentDefaultPoints.default)} value={String(lan.globalTournamentDefaultPoints.default)} onChange={(e) => updateDefault(e.target.value)}></input>
        </div>
    </div>
}*/