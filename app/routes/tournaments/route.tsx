import { Outlet } from "@remix-run/react";
import TournamentsList from "./tournaments-list";


export default function Tournaments() {
    return <div className="is-full-height is-flex-row gap-3 p-3">
        <TournamentsList />
        <Outlet />
    </div>
}