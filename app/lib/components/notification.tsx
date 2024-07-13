import { useEffect } from "react";
import { cssTransition, toast, ToastContainer } from "react-toastify";
import { useEventSource } from "remix-utils/sse/react";
import { SSE_NOTIFICATION_MESSAGE_EVENT } from "~/routes/sse/route";


const notificationAnimation = cssTransition({
  enter: "toast-enter-animation",
  exit: "toast-exit-animation"
});

export function Notification() {
  const message = useEventSource("/sse", { event: SSE_NOTIFICATION_MESSAGE_EVENT });

  useEffect(() => {
    console.log("message "+message)
    if (!message) {
      return
    }
    toast.info(message, {
      toastId: message,
      autoClose: 5000,
      progressStyle: { background: "transparent" },
      closeButton: false
    });
  }, [message]);


  return (
    <ToastContainer
      limit={1}
      position={"top-center"}
      transition={notificationAnimation}
    />
  )
}