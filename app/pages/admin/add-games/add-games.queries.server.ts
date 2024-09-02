import { updateGame } from "~/lib/persistence/games.server"
import { Game } from "~/lib/types/games"
import { mkdir } from "fs/promises"
import { logger } from "~/lib/logging/logging"
import { get } from "https"
import { createWriteStream } from "fs"
import lanConfig from "config.json"


interface GameFromIGDB {
    id: number,
    name: string,
    cover: { image_id: string },
    platforms: number[] | undefined,
    artworks?: { image_id: string }[],
    screenshots?: { image_id: string }[],
    first_release_date?: number
}

export type AddOrUpdateGameRepresentation = Partial<Game>

const IGDB_IMAGES_FOLDER = "public/igdb"
let IGDB_TOKEN: string

export async function addOrUpdateGame(game: AddOrUpdateGameRepresentation) {
    if (!game.id) return
    updateGame(game.id, game)

    if (!game.picture) return
    await downloadPicture(game.picture)
}

export async function searchGames(query: string | null) {
    if (!query) {
        return []
    }

    // Auth on IGDB API
    if (!IGDB_TOKEN)
        await getIGDBToken()
    if (!IGDB_TOKEN) {
        console.log("Can't authentify on IGDB API. Verify your credentials.")
        return []
    }

    const myHeaders = new Headers()
    myHeaders.append("Client-ID", lanConfig.igdb_api.igdb_client_id || "")
    myHeaders.append("Authorization", "Bearer " + IGDB_TOKEN)

    const raw = `search "${query}"; limit 500; where category = 0 & version_parent = null; fields id, name, platforms, cover.image_id, artworks.image_id, screenshots.image_id, first_release_date;`
    const requestOptions: RequestInit = { method: 'POST', headers: myHeaders, body: raw, redirect: 'follow' }
    const rawRes = await fetch("https://api.igdb.com/v4/games/", requestOptions)

    const res: GameFromIGDB[] = await rawRes.json()

    return res.filter((game: GameFromIGDB) =>
        game.name.toLowerCase().includes(query.toLowerCase())
        && game.cover
        && (game.screenshots || game.artworks)
    )
        .map((game: GameFromIGDB) => ({
            id: game.id,
            name: game.name,
            platforms: game.platforms || [],
            cover: game.cover.image_id,
            pictures: [...(game.artworks?.map(a => a.image_id) || []), ...(game.screenshots?.map(a => a.image_id) || [])],
            release: game.first_release_date ? Number(new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(game.first_release_date * 1000)) : undefined
        }))
}

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

async function getIGDBToken() {
    const rawRes = await fetch(
        "https://id.twitch.tv/oauth2/token?client_id=" + lanConfig.igdb_api.igdb_client_id
        + "&client_secret=" + lanConfig.igdb_api.igdb_client_secret
        + "&grant_type=client_credentials",
        { method: 'POST', redirect: 'follow' })
    if (!rawRes.ok) return null
    const res: { access_token: string, expires_in: number, token_type: string } = await rawRes.json()
    IGDB_TOKEN = res.access_token
}

