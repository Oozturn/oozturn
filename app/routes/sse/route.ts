import { LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { EMITTER_GLOBAL_TOURNAMENT_UPDATE, EMITTER_NOTIFICATION_MESSAGE, emitter } from "~/lib/emitter.server";
import { getUserId, requireUserLoggedIn } from "~/lib/session.server";

export const SSE_TOURNAMENT_UPDATE_EVENT = "globalTournamentUpdate"
export const SSE_NOTIFICATION_MESSAGE_EVENT = "notificationMessage"

export async function loader({ request }: LoaderFunctionArgs) {
    requireUserLoggedIn(request)
    const userId = await getUserId(request)
    return eventStream(request.signal, function setup(send, abort) {
        function handleGlobalTournamentUpdate(message: any) {
            if (message.emitter != userId) {
                send({event :SSE_TOURNAMENT_UPDATE_EVENT,  data: new Date().toISOString() });
            }
        }
        function handleNotificationMessageEvent(message: {content:string}) {
            send({event :SSE_NOTIFICATION_MESSAGE_EVENT,  data: message.content });
        }

        emitter.on(EMITTER_GLOBAL_TOURNAMENT_UPDATE, handleGlobalTournamentUpdate);
        emitter.on(EMITTER_NOTIFICATION_MESSAGE, handleNotificationMessageEvent);

        return function clear() {
            emitter.off(EMITTER_GLOBAL_TOURNAMENT_UPDATE, handleGlobalTournamentUpdate);
            emitter.off(EMITTER_NOTIFICATION_MESSAGE, handleNotificationMessageEvent);
        };
    });
}

