import { Outlet } from "@remix-run/react";


export default function Tournaments() {
    return <div className="is-full-height is-flex-row p-3">
        <Outlet/>
    </div>
}