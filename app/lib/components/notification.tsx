import { useEffect } from "react"
import { cssTransition, toast, ToastContainer } from "react-toastify"
import { useEventSource } from "remix-utils/sse/react"
import 'react-toastify/dist/ReactToastify.css';
import { notificationProps } from "../events/types";
import { Link } from "@remix-run/react";
import { SSE_NOTIFICATION_MESSAGE_EVENT } from "~/api/sse";

export function Notification() {
  const message = useEventSource("/sse", { event: SSE_NOTIFICATION_MESSAGE_EVENT })

  useEffect(() => {
    if (!message) return
    const { time, messageType, data } = JSON.parse(message) as notificationProps
    if (["startTournament", "endTournament"].includes(messageType)) {
      const { id, name } = JSON.parse(data) as { id: string, name: string }
      toast.info(
        <Link to={"/tournaments/" + id}>Le tournoi {name} vient de {messageType == "startTournament" ? "démarrer" : "s'achever"} !</Link>,
        {
          toastId: time
        }
      )
    }
    else
      toast.error(message)
  }, [message])


  return (
    <ToastContainer
      limit={1}
      position="top-center"
      autoClose={5000}
      hideProgressBar
      closeOnClick
      draggable={false}
      theme="dark"
      transition={cssTransition({
        enter: "toast-enter-animation",
        exit: "toast-exit-animation"
      })}
      closeButton={false}
    />
  )
}