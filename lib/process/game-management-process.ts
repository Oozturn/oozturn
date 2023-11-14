import { GraphQLError } from "graphql"
import { doTransaction } from "../persistence/state"
import { createWriteStream } from "fs"
import { get } from "https"
import { mkdir } from "fs/promises"
import { Logger } from "pino"
import { IgdbGame } from "../../__generated__/gql/types"

interface GameFromIGDB {
    id: number,
    name: string,
    cover: { image_id: string },
    platforms: number[] | undefined,
    artworks?: { image_id: string }[],
    screenshots?: { image_id: string }[],
    first_release_date?: number
}

export async function searchGame(searchCriteria: string, idToSearch?: number) : Promise<IgdbGame[]> {
    
    // Auth on IGDB API
    if (process.env.IGDB_AUTH == undefined)
        await getIGDBToken()
    if (process.env.IGDB_AUTH == undefined) {
        console.log("Can't authentify on IGDB API. Verify your credentials.")
        return []
    }

    var myHeaders = new Headers()
    myHeaders.append("Client-ID", process.env.IGDB_CLIENT_ID || "")
    myHeaders.append("Authorization", "Bearer " + process.env.IGDB_AUTH)

    var raw = `search "${searchCriteria}"; limit 500; where category = 0 & version_parent = null;
    fields id, name, platforms, cover.image_id, artworks.image_id, screenshots.image_id, first_release_date;`
    var requestOptions: RequestInit = { method: 'POST', headers: myHeaders, body: raw, redirect: 'follow' };
    const rawRes = await fetch("https://api.igdb.com/v4/games/", requestOptions)
    
    const res: GameFromIGDB[] = await rawRes.json()
    return res.filter((game: GameFromIGDB) => (idToSearch != undefined ? Number(game.id) == idToSearch : true)
        && game.name.toLowerCase().includes(searchCriteria.toLowerCase())
        && game.cover
        && (game.screenshots || game.artworks))
    .map((game: GameFromIGDB) => ({
        id: game.id,
        name: game.name,
        platforms: game.platforms || [],
        cover: game.cover.image_id,
        pictures: [...(game.artworks?.map(a => a.image_id) || []), ...(game.screenshots?.map(a => a.image_id) || [])],
        release: game.first_release_date ? Number(new Intl.DateTimeFormat('en-US', {year: 'numeric'}).format(game.first_release_date * 1000)) : undefined
    }))
}

async function getIGDBToken() {
    const rawRes = await fetch(
        "https://id.twitch.tv/oauth2/token?client_id=" + process.env.IGDB_CLIENT_ID
        + "&client_secret=" + process.env.IGDB_CLIENT_SECRET
        + "&grant_type=client_credentials",
        {method: 'POST', redirect: 'follow'})
    if (!rawRes.ok) return null
    const res: {access_token: string, expires_in: number, token_type: string} = await rawRes.json()
    process.env.IGDB_AUTH = res.access_token
}

export async function addOrUpdateGame(id: number, name: string, cover: string, picture: string, platforms: number[], release: number | undefined, logger: Logger) {
    return await doTransaction(async state => {
        const incomingGame = { id: id, name: name, cover: cover, platforms: platforms, picture: picture, release: release }
        const index = state.games.findIndex(game => game.id == id)
        if (index != -1) {
            state.games[index] = incomingGame
        }
        else {
            state.games.push(incomingGame)
        }
        await downloadPicture(incomingGame.picture, logger)
        return "" + id
    })
}

export async function removeGame(id: number) {
    return await doTransaction(state => {
        const index = state.games.findIndex(game => game.id == id)
        if (index != -1) {
            state.games.splice(index, 1)
        }
        else {
            throw new GraphQLError(`Game ${id} not found`)
        }
        return "success"
    })
}

async function downloadPicture(pictureId: string, logger: Logger) {
    await mkdir('uploads/igdb', { recursive: true })
    logger.info(`Downloading https://images.igdb.com/igdb/image/upload/t_screenshot_big/${pictureId}.jpg`)
    await (downloadFile(`https://images.igdb.com/igdb/image/upload/t_screenshot_big/${pictureId}.jpg`, `uploads/igdb/${pictureId}.jpg`))
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