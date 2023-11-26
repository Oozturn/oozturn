import { Outlet } from "@remix-run/react";
import Navbar from "~/lib/components/layout/navbar";


export default function Main() {
    return (
        <>
            <Navbar />
            <main className="main is-clipped">
                <Outlet />
            </main>
        </>
    )
}