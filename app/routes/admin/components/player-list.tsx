import { useFetcher } from "@remix-run/react"
import React, { useState } from "react"
import { Item, ItemParams, Menu, useContextMenu } from "react-contexify"
import { useLan } from "~/lib/components/contexts/LanContext"
import { useTournaments } from "~/lib/components/contexts/TournamentsContext"
import { useUsers } from "~/lib/components/contexts/UsersContext"
import { ButtonMore } from "~/lib/components/elements/custom-button"
import { ModalLayout } from "~/lib/components/elements/custom-modal"
import { UserTileRectangle } from "~/lib/components/elements/user-tile"
import { User } from "~/lib/types/user"
import { AdminIntents } from "../route"


export function PlayerList() {
    const [hooveredPlayer, setHooveredPlayer] = useState("")
    const [activePlayer, setActivePlayer] = useState("")
    const [userInEdit, setUserInEdit] = useState<User | null>(null)
    const [newUsername, setNewUsername] = useState("")
    const { show: showMenu } = useContextMenu();
    const users = useUsers()
    const tournaments = useTournaments()
    const lan = useLan()

    const fetcher = useFetcher()

    const leaderboard: any[] = []

    const handleMenuItemClick = ({ id, event, props }: ItemParams<{ user: User }>) => {
        switch (id) {
            case "resetPassword":
                resetUserPassword(props!.user.id)
                break;
            case "renamePlayer":
                startPlayerRename(props!.user)
                break;
        }
    }

    function resetUserPassword(userId: string) {
        let fd = new FormData()
        fd.append("userId", userId)
        fd.append("intent", AdminIntents.RESET_USER_PASSWORD)
        fetcher.submit(fd, { method: "POST" })
    }

    function startPlayerRename(user: User) {
        setUserInEdit(user)
        setNewUsername(user.username)
    }

    function renamePlayer(userId: string, newUsername: string) {
        let fd = new FormData()
        fd.append("userId", userId)
        fd.append("newUsername", newUsername)
        fd.append("intent", AdminIntents.RENAME_PLAYER)
        fetcher.submit(fd, { method: "POST" })
    }

    return <div className="flat-box has-background-secondary-level adminPlayersList is-full-height is-flex-col pr-2">
        <div className="is-title medium mb-2">Joueurs</div>
        <ModalLayout
            show={!!userInEdit}
            onHide={() => { setUserInEdit(null) }}
            contentSlot={
                <><div className="field">
                    <label className="label has-text-white" >Nouveau pseudo</label>
                    <div className="control">
                        <input className="input" type="text" placeholder="Text input"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                        />
                    </div>
                </div>
                </>
            }
            buttonsSlot={
                <div className="customButton fade-on-mouse-out is-unselectable has-background-primary-accent is-clickable"
                    onClick={() => {
                        renamePlayer(userInEdit!.id, newUsername)
                        setUserInEdit(null)
                    }}>
                    Confirmer
                </div>
            }
        />
        <div className="playerTilesContainer is-flex-col p-0 m-0 is-scrollable pr-2">
            {users && users.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase())).map(user =>
                <React.Fragment key={user.id}>
                    <div className={`playerTile is-flex-col is-clickable ${activePlayer == user.id ? 'is-active' : ''}`} onMouseEnter={() => setHooveredPlayer(user.id)} onMouseLeave={() => setHooveredPlayer("")}>
                        <div className="is-flex is-justify-content-space-between is-align-items-center">
                            <div className="is-flex is-clickable grow" onClick={() => setActivePlayer(activePlayer == user.id ? '' : user.id)}>
                                <UserTileRectangle userId={user.id} height={40} />
                            </div>
                            <ButtonMore height={40} show={hooveredPlayer == user.id} callback={(e) => {
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
                        <div className='playerTooltip is-flex pl-3' onClick={() => setActivePlayer(activePlayer == user.id ? '' : user.id)}>
                            <div className='is-flex-col'>
                                <div>IP: {user.ips ? user.ips[0] : 'unknown'}</div>
                                <div>Tournois: {tournaments?.filter(tournament => tournament.players.find(player => player.userId == user.id)).length || 0}</div>
                                <div>Points: {leaderboard?.find(pscore => pscore.player.id == user.id)?.points || 0}</div>
                            </div>
                        </div>
                    </div>
                    <Menu id={user.id}>
                        <Item id="renamePlayer" onClick={handleMenuItemClick}>Changer le pseudo</Item>
                        {lan.authenticationNeeded &&
                            <Item id="resetPassword" onClick={handleMenuItemClick}>Réinitialisation du mot de passe</Item>
                        }
                    </Menu>
                </React.Fragment>
            )}
        </div>
    </div>
}