import { createContext } from "react";
import { Tournament } from "~/lib/types/tournaments";


export const TournamentsContext = createContext<Tournament[]>([]);