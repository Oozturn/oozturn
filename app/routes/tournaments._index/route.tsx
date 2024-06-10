import { MetaFunction } from "@remix-run/node";
import { useLan } from "~/lib/components/contexts/LanContext";

export const meta: MetaFunction = () => {
    return [
        { title: useLan().name + " - Tournois" }
    ]
}

export default function TournamentSelection() {
    return <div className='grow is-flex-row has-background-secondary-level justify-center align-center'>
        Sélectionner un tournoi dans la liste
    </div>
}