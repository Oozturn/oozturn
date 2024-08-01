import { useRevalidator } from "@remix-run/react"
import { useEffect } from "react"
import { useEventSource } from "remix-utils/sse/react"
import { SSE_TOURNAMENT_UPDATE_EVENT } from "./route"

export function useRevalidateOnGlobalTournamentUpdate() {
  const revalidator = useRevalidator()
  const time = useEventSource("/sse", { event: SSE_TOURNAMENT_UPDATE_EVENT })

  useEffect(() => {
    if (revalidator.state === "idle") {
      revalidator.revalidate()
    }
    console.log(time)
  }, [time])
}

