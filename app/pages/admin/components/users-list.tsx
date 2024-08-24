import { useFetcher } from "@remix-run/react"
import React, { useState } from "react"
import { Item, ItemParams, Menu, TriggerEvent, useContextMenu } from "react-contexify"
import { useTournaments } from "~/lib/components/contexts/TournamentsContext"
import { useUsers } from "~/lib/components/contexts/UsersContext"
import { SquareButton, CustomButton } from "~/lib/components/elements/custom-button"
import { CustomModalBinary } from "~/lib/components/elements/custom-modal"
import { UserTileRectangle } from "~/lib/components/elements/user-tile"
import { User } from "~/lib/types/user"
import { AdminIntents } from "../admin"
import { clickorkey } from "~/lib/utils/clickorkey"
import { useRevalidateOnUsersUpdate } from "~/api/sse.hook"
import lanConfig from "config.json"
import { MoreSVG, SmallCrossSVG } from "~/lib/components/data/svg-container"

export function UsersList() {
    const [hooveredUser, setHooveredUser] = useState("")
    const [activeUser, setActiveUser] = useState("")
    const [userInEdit, setUserInEdit] = useState<User | null>(null)
    const [newUsername, setNewUsername] = useState("")
    const { show: showMenu } = useContextMenu()
    const users = useUsers()
    const tournaments = useTournaments()
    useRevalidateOnUsersUpdate()

    const [showAddUsers, setShowAddUsers] = useState(false)
    const [newUsers, setNewUsers] = useState("")
    function addUsers() {
        const fd = new FormData()
        fd.append("users", JSON.stringify(newUsers.split(/\n/)))
        fd.append("intent", AdminIntents.ADD_USERS)
        fetcher.submit(fd, { method: "POST" })
    }

    const fetcher = useFetcher()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leaderboard: any[] = []

    const handleMenuItemClick = ({ id, props }: ItemParams<{ user: User }>) => {
        switch (id) {
            case "resetPassword":
                resetUserPassword(props!.user.id)
                break
            case "renameUser":
                startUserRename(props!.user)
                break
        }
    }

    function resetUserPassword(userId: string) {
        const fd = new FormData()
        fd.append("userId", userId)
        fd.append("intent", AdminIntents.RESET_USER_PASSWORD)
        fetcher.submit(fd, { method: "POST" })
    }

    function startUserRename(user: User) {
        setUserInEdit(user)
        setNewUsername(user.username)
    }

    function renameUser(userId: string, newUsername: string) {
        const fd = new FormData()
        fd.append("userId", userId)
        fd.append("newUsername", newUsername)
        fd.append("intent", AdminIntents.RENAME_USER)
        fetcher.submit(fd, { method: "POST" })
    }

    return <div className="has-background-secondary-level adminUsersList is-full-height is-flex-col pr-2 p-4 gap-3">
        <div className="is-flex justify-space-between align-center">
            <div className="is-title medium">Joueurs</div>
            <CustomButton customClasses="small-button" colorClass="has-background-primary-accent" callback={() => setShowAddUsers(true)} contentItems={[SmallCrossSVG(), "Add users"]} />
        </div>
        <CustomModalBinary
            show={!!userInEdit}
            onHide={() => { setUserInEdit(null) }}
            onConfirm={() => {
                renameUser(userInEdit!.id, newUsername)
                setUserInEdit(null)
            }}
            content={
                <div className="grow is-flex-col align-stretch p2 gap-2">
                    <div className="">Nouveau pseudo pour {userInEdit?.username} :</div>
                    <input type="text" placeholder="New username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                </div>
            }
        />
        <CustomModalBinary
            show={showAddUsers}
            onHide={() => setShowAddUsers(false)}
            content={
                <div className="grow is-flex-col align-stretch">
                    <div className="">Liste ici les noms des utilisateurs à ajouter (un par ligne) :</div>
                    {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                    <textarea autoFocus rows={10} onChange={e => setNewUsers(e.target.value)} />
                </div>
            }
            cancelButton={true}
            onConfirm={addUsers}
        />
        <div className="UserTilesContainer is-flex-col p-0 m-0 is-scrollable pr-2">
            {/* <div className="is-flex align-center justify-center has-background-primary-accent fade-on-mouse-out is-clickable is-unselectable" style={{minHeight:"40px"}} {...clickorkey(() => setShowAddUsers(true))}>Ajouter des joueurs</div> */}
            {users && users.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase())).map(user =>
                <React.Fragment key={user.id}>
                    <div className={`userTile is-flex-col is-clickable ${activeUser == user.id ? 'is-active' : ''}`} onMouseEnter={() => setHooveredUser(user.id)} onMouseLeave={() => setHooveredUser("")}>
                        <div className="is-flex justify-space-between align-center">
                            <div className="is-flex is-clickable grow" {...clickorkey(() => setActiveUser(activeUser == user.id ? '' : user.id))}>
                                <UserTileRectangle userId={user.id} height={40} />
                            </div>
                            <SquareButton contentItems={[MoreSVG()]} height={40} show={hooveredUser == user.id} callback={(e: TriggerEvent) => {
                                showMenu({
                                    id: "usersMenu",
                                    event: e,
                                    props: {
                                        user: user
                                    }
                                })
                            }}
                            />
                        </div>
                        <div className='userTooltip is-flex pl-3' {...clickorkey(() => setActiveUser(activeUser == user.id ? '' : user.id))}>
                            <div className='is-flex-col'>
                                <div>IP: {user.ips ? user.ips[0] : 'unknown'}</div>
                                <div>Tournois: {tournaments?.filter(tournament => tournament.players.find(player => player.userId == user.id)).length || 0}</div>
                                <div>Points: {leaderboard?.find(pscore => pscore.player.id == user.id)?.points || 0}</div>
                            </div>
                        </div>
                    </div>
                </React.Fragment>
            )}
        </div>
        <Menu id="usersMenu" animation="slide" >
            <Item id="renameUser" onClick={handleMenuItemClick}>Renommer</Item>
            {lanConfig.security.authentication_needed &&
                <Item id="resetPassword" onClick={handleMenuItemClick}>Réinitialiser le mot de passe</Item>
            }
            <Item id="deleteUser" onClick={handleMenuItemClick}>Supprimer</Item>

        </Menu>
    </div>
}