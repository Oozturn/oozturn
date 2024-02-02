import { createContext } from "react";
import { Tournament } from "~/lib/persistence/tournaments.server";


export const TournamentsContext = createContext<Tournament[]>([]);