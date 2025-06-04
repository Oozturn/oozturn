import { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/react";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { get } from "https"
import { logger } from "~/lib/logging/logging";
import { requireUserAdmin } from "~/lib/session.server";
import crypto from 'crypto'
import sharp from "sharp";



export enum Intents {
    LOCAL_TOURNAMENT_PIC = 'local_tournament_pic',
    IGDB_TOURNAMENT_PIC = 'igdb_tournament_pic',
    REMOVE_TOURNAMENT_PIC = 'remove_tournament_pic',
    SEARCH_GAMES = 'search_games',
}

export interface gameInfo {
    name: string
    cover: string
    pictures: string[]
}

export async function action({ request }: ActionFunctionArgs) {
    await requireUserAdmin(request)
    const formData = await request.formData()
    const intent = formData.get("intent")

    switch (intent) {
        case Intents.LOCAL_TOURNAMENT_PIC:
            const file = formData.get("localFile") as File
            if (file) {
                const filename = await storePicture(file)
                console.log("stored " + filename)
                return json({ picture: filename, games: [] as gameInfo[] })
            }
            break
        case Intents.IGDB_TOURNAMENT_PIC:
            const pictureRef = String(formData.get("picture"))
            if (pictureRef) {
                await downloadPicture(pictureRef)
                return json({ picture: pictureRef, games: [] as gameInfo[] })
            }
            break
        case Intents.REMOVE_TOURNAMENT_PIC:
            // upload picture and send back its ID / url
            return json({ picture: "tutu", games: [] as gameInfo[] })
            break
        case Intents.SEARCH_GAMES:
            // search data on IGDB and send back a list of pictures
            return json({ picture: "titi", games: [] as gameInfo[] })
            break
    }
    return json({ picture: "toto", games: [] as gameInfo[] })
}

const IGDB_IMAGES_FOLDER = "uploads/igdb"

async function downloadPicture(pictureId: string) {
    await mkdir(IGDB_IMAGES_FOLDER, { recursive: true })
    logger.info(`Downloading https://images.igdb.com/igdb/image/upload/t_screenshot_big/${pictureId}.jpg`)
    await (downloadFile(`https://images.igdb.com/igdb/image/upload/t_screenshot_big/${pictureId}.jpg`, `${IGDB_IMAGES_FOLDER}/${pictureId}.jpg`))
}
async function downloadFile(url: string, targetFile: string) {
    return await new Promise((resolve, reject) => {
        get(url, response => {
            const code = response.statusCode ?? 0

            if (code >= 400) {
                return reject(new Error(response.statusMessage))
            }

            // handle redirects
            if (code > 300 && code < 400 && !!response.headers.location) {
                return resolve(
                    downloadFile(response.headers.location, targetFile)
                )
            }

            // save the file to disk
            const fileWriter = createWriteStream(targetFile)
                .on('finish', () => {
                    resolve({})
                })
            response.pipe(fileWriter)
        }).on('error', error => {
            reject(error)
        })
    })
}

async function storePicture(file: File): Promise<string> {
    console.log("storing picture " + file.name)
    const inputBuffer = Buffer.from(await file.arrayBuffer())
    const hashSum = crypto.createHash('md5')
    hashSum.update(inputBuffer)
    const hex = hashSum.digest('hex')
    const filename = `${hex}.jpg`
    await mkdir(IGDB_IMAGES_FOLDER, { recursive: true })
    try {
        await sharp(inputBuffer, { animated: true, pages: -1 })
            .resize(256, 256, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toFile(`${IGDB_IMAGES_FOLDER}/${filename}`)
    } catch (e) {
        console.error(e)
        throw e
    }
    return filename
}