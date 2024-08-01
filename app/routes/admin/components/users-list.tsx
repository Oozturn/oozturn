import { useFetcher } from "@remix-run/react"
import React, { useState } from "react"
import { Item, ItemParams, Menu, TriggerEvent, useContextMenu } from "react-contexify"
import { useLan } from "~/lib/components/contexts/LanContext"
import { useTournaments } from "~/lib/components/contexts/TournamentsContext"
import { useUsers } from "~/lib/components/contexts/UsersContext"
import { ButtonMore } from "~/lib/components/elements/custom-button"
import { CustomModalBinary } from "~/lib/components/elements/custom-modal"
import { UserTileRectangle } from "~/lib/components/elements/user-tile"
import { User } from "~/lib/types/user"
import { AdminIntents } from "../route"
import { clickorkey } from "~/lib/utils/clickorkey"


export function UsersList() {
    const [hooveredUser, setHooveredUser] = useState("")
    const [activeUser, setActiveUser] = useState("")
    const [userInEdit, setUserInEdit] = useState<User | null>(null)
    const [newUsername, setNewUsername] = useState("")
    const { show: showMenu } = useContextMenu()
    const users = useUsers()
    const tournaments = useTournaments()
    const lan = useLan()

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

    return <div className="has-background-secondary-level adminUsersList is-full-height is-flex-col pr-2 pl-4 py-4">
        <div className="is-title medium mb-2">Joueurs</div>
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
        <div className="UserTilesContainer is-flex-col p-0 m-0 is-scrollable pr-2">
            {users && users.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase())).map(user =>
                <React.Fragment key={user.id}>
                    <div className={`userTile is-flex-col is-clickable ${activeUser == user.id ? 'is-active' : ''}`} onMouseEnter={() => setHooveredUser(user.id)} onMouseLeave={() => setHooveredUser("")}>
                        <div className="is-flex is-justify-content-space-between is-align-items-center">
                            <div className="is-flex is-clickable grow" {...clickorkey(() => setActiveUser(activeUser == user.id ? '' : user.id))}>
                                <UserTileRectangle userId={user.id} height={40} />
                            </div>
                            <ButtonMore height={40} show={hooveredUser == user.id} callback={(e: TriggerEvent) => {
                                showMenu({
                                    id: user.id,
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
                    <Menu id={user.id} animation="slide" >
                        <Item id="renameUser" onClick={handleMenuItemClick}>Renommer</Item>
                        {lan.authenticationNeeded &&
                            <Item id="resetPassword" onClick={handleMenuItemClick}>Réinitialiser le mot de passe</Item>
                        }
                        <Item id="deleteUser" onClick={handleMenuItemClick}>Supprimer</Item>

                    </Menu>
                </React.Fragment>
            )}
        </div>
    </div>
}