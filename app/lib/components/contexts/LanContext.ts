import { createContext } from "react";
import { Lan } from "../persistence/lan.server";

export const LanContext = createContext<Lan|undefined>(undefined);