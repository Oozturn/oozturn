import { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/react";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { get } from "https"
import { logger } from "~/lib/logging/logging";
import { getUserId, requireUserAdmin } from "~/lib/session.server";
import crypto from 'crypto'
import sharp from "sharp";
import { BracketSettings, TournamentProperties, TournamentSettings, TournamentStatus } from "~/lib/tournamentEngine/types";
import { getTournament, newTournament, updateTournamentBracketSettings, updateTournamentProperties, updateTournamentSettings } from "~/lib/persistence/tournaments.server";
import { EventServerError } from "~/lib/emitter.server";

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

    switch (intent) {
        case "createTournament":
            const tournamentSettings = JSON.parse(String(formData.get("tournamentSettings"))) as TournamentSettings
            const tournamentProperties = JSON.parse(String(formData.get("tournamentProperties"))) as TournamentProperties
            if (tournamentImageFile) {
                const filename = await storePicture(tournamentImageFile)
                tournamentProperties.picture = filename
            }
            if (!tournamentHasImage) tournamentProperties.picture = undefined
            newTournament(tournamentId, tournamentProperties, tournamentSettings, tournamentBracketSettings)
            return redirect("/tournaments/" + tournamentId)
        case "updateTournament":
            const partialTournamentSettings = JSON.parse(String(formData.get("tournamentSettings"))) as Partial<TournamentSettings>
            const partialTournamentProperties = JSON.parse(String(formData.get("tournamentProperties"))) as Partial<TournamentProperties>
            if (tournamentImageFile) {
                const filename = await storePicture(tournamentImageFile)
                partialTournamentProperties.picture = filename
            }
            if (!tournamentHasImage) partialTournamentProperties.picture = undefined
            try {
                if ([TournamentStatus.Open, TournamentStatus.Balancing].includes(getTournament(tournamentId).getStatus())) {
                    updateTournamentBracketSettings(tournamentId, tournamentBracketSettings)
                    updateTournamentSettings(tournamentId, partialTournamentSettings)
                }
                updateTournamentProperties(tournamentId, partialTournamentProperties)
                return redirect("/tournaments/" + tournamentId)
            } catch (error) {
                const userId = await getUserId(request) as string
                EventServerError(userId, "Erreur lors de la mise à jour du tournoi : " + error as string)
            }
            break
    }
}

const TOURNAMENT_IMAGES_FOLDER = "uploads/tournaments"

async function storePicture(file: File): Promise<string> {
    console.log("storing picture " + file.name)
    const inputBuffer = Buffer.from(await file.arrayBuffer())
    const hashSum = crypto.createHash('md5')
    hashSum.update(inputBuffer)
    const hex = hashSum.digest('hex')
    const filename = `${hex}.webp`
    await mkdir(TOURNAMENT_IMAGES_FOLDER, { recursive: true })
    try {
        await sharp(inputBuffer, { animated: true, pages: -1 })
            .resize(256, 256, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toFile(`${TOURNAMENT_IMAGES_FOLDER}/${filename}`)
    } catch (e) {
        console.error(e)
        throw e
    }
    return filename
}