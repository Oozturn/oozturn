import { MetaFunction } from "@remix-run/node";
import { useLan } from "~/lib/components/contexts/LanContext";

export const meta: MetaFunction = () => {
    return [
        { title: useLan().name + " - Tournoi inconnu" }
    ]
}

export default function TournamentNotFound() {
    return <div className='grow is-flex-row has-background-secondary-level justify-center align-center'>
        404 — Tournament not found
    </div>
}