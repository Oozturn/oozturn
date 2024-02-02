import { createContext } from "react";
import { Game } from "~/lib/persistence/games.server";


export const GamesContext = createContext<Game[]>([]);