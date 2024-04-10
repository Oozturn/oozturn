import { createContext, useContext } from "react";
import { User } from "~/lib/types/user";


export const UserContext = createContext<User | undefined>(undefined);

export function useUser() {
    const user = useContext(UserContext)
    if (!user) {
        throw new Error('useUser must be used within a UserContext.Provider')
    }
    return user
}