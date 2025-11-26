import { ActionFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/react"
import { getUserId, requireUserAdmin } from "~/lib/session.server"
import {
  BracketSettings,
  TournamentProperties,
  TournamentSettings,
  TournamentStatus
} from "~/lib/tournamentEngine/types"
import {
  getTournament,
  newTournament,
  updateTournamentBracketSettings,
  updateTournamentProperties,
  updateTournamentSettings
} from "~/lib/persistence/tournaments.server"
import { EventServerError } from "~/lib/emitter.server"
import { storePicture, TOURNAMENT_IMAGES_FOLDER } from "~/lib/utils/storeImage"

export interface gameInfo {
  name: string
  cover: string
  pictures: string[]
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUserAdmin(request)
  const formData = await request.formData()
  const intent = formData.get("intent")

  const tournamentId = String(formData.get("tournamentId"))
  const tournamentImageFile = formData.get("tournamentImageFile") as File | null
  const tournamentBracketSettings = JSON.parse(String(formData.get("tournamentBracketSettings"))) as BracketSettings[]
  const tournamentHasImage = formData.get("tournamentHasImage") === "true"

  let imageFilename: string | undefined = undefined
  if (tournamentImageFile) {
    imageFilename = await storePicture(tournamentImageFile, TOURNAMENT_IMAGES_FOLDER)
  }

  if (intent == "createTournament") {
    const tournamentSettings = JSON.parse(String(formData.get("tournamentSettings"))) as TournamentSettings
    const tournamentProperties = JSON.parse(String(formData.get("tournamentProperties"))) as TournamentProperties
    if (tournamentImageFile) {
      tournamentProperties.picture = imageFilename
    }
    if (!tournamentHasImage) tournamentProperties.picture = undefined
    newTournament(tournamentId, tournamentProperties, tournamentSettings, tournamentBracketSettings)
  } else if (intent == "updateTournament") {
    const partialTournamentSettings = JSON.parse(
      String(formData.get("tournamentSettings"))
    ) as Partial<TournamentSettings>
    const partialTournamentProperties = JSON.parse(
      String(formData.get("tournamentProperties"))
    ) as Partial<TournamentProperties>
    if (tournamentImageFile) {
      partialTournamentProperties.picture = imageFilename
    }
    if (!tournamentHasImage) partialTournamentProperties.picture = undefined
    try {
      if ([TournamentStatus.Open, TournamentStatus.Balancing].includes(getTournament(tournamentId).getStatus())) {
        updateTournamentBracketSettings(tournamentId, tournamentBracketSettings)
        updateTournamentSettings(tournamentId, partialTournamentSettings)
      }
      updateTournamentProperties(tournamentId, partialTournamentProperties)
    } catch (error) {
      const userId = (await getUserId(request)) as string
      EventServerError(userId, ("Erreur lors de la mise à jour du tournoi : " + error) as string)
    }
  }

  return redirect("/tournaments/" + tournamentId)
}
