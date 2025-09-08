import useLocalStorageState from "use-local-storage-state";


export function saveLoggedUser(username: string) {
    const [lastLogguedUsers, setLastLogguedUsers] = useLocalStorageState<string[]>("lastLogguedUsers", { defaultValue: [] })
    setLastLogguedUsers([username, ...lastLogguedUsers.filter((user) => user !== username)].slice(0, 3))
}

export function getLoggedUsers() {
    const [lastLogguedUsers,] = useLocalStorageState<string[]>("lastLogguedUsers", { defaultValue: [] })
    return lastLogguedUsers
}

export function getLastLoggedUser() {
    const [lastLogguedUsers,] = useLocalStorageState<string[]>("lastLogguedUsers", { defaultValue: [] })
    return lastLogguedUsers[0] || ""
}

export function removeLoggedUser(username: string) {
    const [lastLogguedUsers, setLastLogguedUsers] = useLocalStorageState<string[]>("lastLogguedUsers", { defaultValue: [] })
    setLastLogguedUsers(lastLogguedUsers.filter((user) => user !== username))
}

export function clearLoggedUsers() {
    const [, setLastLogguedUsers] = useLocalStorageState<string[]>("lastLogguedUsers", { defaultValue: [] })
    setLastLogguedUsers([])
}