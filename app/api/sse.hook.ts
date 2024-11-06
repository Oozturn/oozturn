/* eslint-disable react-hooks/exhaustive-deps */
import { useRevalidator } from "@remix-run/react"
import { useEffect } from "react"
import { useEventSource } from "remix-utils/sse/react"
import { EVENT_UPDATE_LAN, EVENT_UPDATE_TOURNAMENT, EVENT_UPDATE_TOURNAMENTS, EVENT_UPDATE_USERS, TOURNAMENT_UPDATE_TYPES } from "~/lib/events/types"
import lanConfig from "config.json"

export function useRevalidateOnGlobalTournamentUpdate() {
  const revalidator = useRevalidator()
  const evtData = useEventSource("/sse", { event: EVENT_UPDATE_TOURNAMENT })

  useEffect(() => {
    if (!evtData) return
    const [, updateType,] = JSON.parse(evtData)
    if (updateType == TOURNAMENT_UPDATE_TYPES.UPDATE_BRACKET) return
    if (revalidator.state === "idle") {
      revalidator.revalidate()
    }
  }, [evtData])
}

export function useRevalidateOnTournamentUpdate(tournamentId: string) {
  const revalidator = useRevalidator()
  const evtData = useEventSource("/sse", { event: EVENT_UPDATE_TOURNAMENT })

  useEffect(() => {
    if (!evtData) return
    const [, , updatedId] = JSON.parse(evtData)
    if (updatedId != tournamentId) return
    if (revalidator.state === "idle") {
      revalidator.revalidate()
    }
  }, [evtData])
}

export function useRevalidateOnTournamentsUpdate() {
  const revalidator = useRevalidator()
  const updateTime = useEventSource("/sse", { event: EVENT_UPDATE_TOURNAMENTS })

  useEffect(() => {
    if (!lanConfig.autorefresh.tournaments_list) return
    if (revalidator.state === "idle") {
      revalidator.revalidate()
    }
  }, [updateTime])
}

export function useRevalidateOnLanUpdate() {
  const revalidator = useRevalidator()
  const updateTime = useEventSource("/sse", { event: EVENT_UPDATE_LAN })

  useEffect(() => {
    if (revalidator.state === "idle") {
      revalidator.revalidate()
    }
  }, [updateTime])
}

export function useRevalidateOnUsersUpdate() {
  const revalidator = useRevalidator()
  const updateTime = useEventSource("/sse", { event: EVENT_UPDATE_USERS })

  useEffect(() => {
    if (!lanConfig.autorefresh.users_list) return
    if (revalidator.state === "idle") {
      revalidator.revalidate()
    }
  }, [updateTime])
}

