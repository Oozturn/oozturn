import { LoaderFunctionArgs } from "@remix-run/node"
import { eventStream } from "remix-utils/sse/server"
import { emitter } from "~/lib/emitter.server"
import { EVENT_UPDATE_LAN, EVENT_UPDATE_TOURNAMENT, EVENT_UPDATE_TOURNAMENTS, EVENT_UPDATE_USERS, notificationProps, TOURNAMENT_UPDATE_TYPES, tournamentUpdateEventProps } from "~/lib/events/types"
import { getTournament } from "~/lib/persistence/tournaments.server"
import { getUserId, requireUserLoggedIn } from "~/lib/session.server"
import lanConfig from "config.json"

export const SSE_NOTIFICATION_MESSAGE_EVENT = "notificationMessage"

export async function loader({ request }: LoaderFunctionArgs) {
    await requireUserLoggedIn(request)
    const userId = await getUserId(request)
    return eventStream(request.signal, function setup(send) {

        function handleUpdateTournament({ updateType, tournamentId }: tournamentUpdateEventProps) {
            const tournament = getTournament(tournamentId)
            if (
                lanConfig.notifications.notify_all_users_on_tournament_start_stop ||
                (userId && tournament.getPlayers().map(p => p.userId).includes(userId))
            ) {
                if (updateType == TOURNAMENT_UPDATE_TYPES.START)
                    send({ event: SSE_NOTIFICATION_MESSAGE_EVENT, data: JSON.stringify(<notificationProps>{ time: new Date().toISOString(), messageType: "startTournament", data: JSON.stringify({ id: tournamentId, name: tournament.getProperties().name }) }) })
                if (updateType == TOURNAMENT_UPDATE_TYPES.END)
                    send({ event: SSE_NOTIFICATION_MESSAGE_EVENT, data: JSON.stringify(<notificationProps>{ time: new Date().toISOString(), messageType: "endTournament", data: JSON.stringify({ id: tournamentId, name: tournament.getProperties().name }) }) })
            }
            send({ event: EVENT_UPDATE_TOURNAMENT, data: JSON.stringify([new Date().toISOString(), updateType, tournamentId]) })
        }
        function handleUpdateTournaments() {
            send({ event: EVENT_UPDATE_TOURNAMENTS, data: new Date().toISOString() })
        }
        function handleUpdateLan() {
            send({ event: EVENT_UPDATE_LAN, data: new Date().toISOString() })
        }
        function handleUpdateUsers() {
            send({ event: EVENT_UPDATE_USERS, data: new Date().toISOString() })
        }

        emitter.on(EVENT_UPDATE_TOURNAMENTS, handleUpdateTournaments)
        emitter.on(EVENT_UPDATE_TOURNAMENT, handleUpdateTournament)
        emitter.on(EVENT_UPDATE_LAN, handleUpdateLan)
        emitter.on(EVENT_UPDATE_USERS, handleUpdateUsers)

        return function clear() {
            emitter.off(EVENT_UPDATE_TOURNAMENTS, handleUpdateTournaments)
            emitter.off(EVENT_UPDATE_TOURNAMENT, handleUpdateTournament)
            emitter.off(EVENT_UPDATE_LAN, handleUpdateLan)
            emitter.off(EVENT_UPDATE_USERS, handleUpdateUsers)
        }
    })
}

