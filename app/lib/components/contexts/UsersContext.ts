import { createContext, useContext } from "react"
import { User } from "~/lib/types/user"


export const UsersContext = createContext<User[] | undefined>(undefined)

export function useUsers() {
    const user = useContext(UsersContext)
    if (!user) {
        throw new Error('useUsers must be used within a UsersContext.Provider')
    }
    return user
}