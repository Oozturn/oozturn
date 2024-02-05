import { createContext } from "react";
import { Game } from "~/lib/types/games";


export const GamesContext = createContext<Game[]>([]);