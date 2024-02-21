import { createContext } from "react";
import { TournamentInfo } from "~/lib/types/tournaments";


export const TournamentsContext = createContext<TournamentInfo[]>([]);