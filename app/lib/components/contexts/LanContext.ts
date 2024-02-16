import { createContext } from "react";
import { Lan } from "~/lib/types/lan";

export const LanContext = createContext<Lan | null>(null);