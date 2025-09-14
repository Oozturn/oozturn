import { useEffect } from "react"
import { cssTransition, toast, ToastContainer } from "react-toastify"
import { useEventSource } from "remix-utils/sse/react"
import 'react-toastify/dist/ReactToastify.css';
import { notificationProps } from "../events/types";
import { Link, useNavigate } from "@remix-run/react";
import { SSE_NOTIFICATION_MESSAGE_EVENT } from "~/api/sse";
import { useLan } from "./contexts/LanContext";
import { useIconUrl } from "./tools/user-theme";

export function NotificationNode() {
  const message = useEventSource("/sse", { event: SSE_NOTIFICATION_MESSAGE_EVENT })
  const lan = useLan()
  const iconUrl = useIconUrl()
  const navigate = useNavigate()


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
      const notification = notifyBrowser(lan.name, iconUrl, `Le tournoi ${name} vient de ${messageType == "startTournament" ? "démarrer" : "s'achever"} !`, time)
      if (notification) {
        notification.onclick = () => {console.log("click!");navigate("/tournaments/" + id)}
      }
    }
    else if (messageType == "error") {
      toast.error(data, {
        toastId: time
      })
    }
    else
      toast.error(message)
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

export function notifyError(message: string) {
  toast.error(message)
}
export function notifyInfo(message: string) {
  toast.info(message)
}

function notifyBrowser(title: string, icon: string, body: string, id: string): Notification | void {

  function emitNotification() {
    // const notification = new Notification(title, {tag: id})
    return new Notification(title, { badge: icon, body: body, tag: id, icon: icon })
  }

  if (!("Notification" in window)) return
  if (Notification.permission === "denied") return
  if (Notification.permission === "granted") emitNotification()
  else Notification.requestPermission().then(permission => { if (permission == "granted") emitNotification() })

}
