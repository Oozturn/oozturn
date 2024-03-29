import { Outlet } from "@remix-run/react";
import TournamentsList from "./tournaments-list";


export default function Tournaments() {
    return <div className="is-full-height is-flex p-3">
        <TournamentsList/>
        <div className='tournamentInfo has-background-secondary-level is-justify-content-center is-align-items-center'>
            <Outlet/>
        </div>
    </div>
}