import { createContext } from "react";


export interface User {
    username?: string,
    isAdmin: boolean,
    team?: string
}

export const UserContext = createContext<User | null>(null);