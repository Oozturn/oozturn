import crypto from "crypto"
import sharp from "sharp"
import { logger } from "../logging/logging"
import { mkdir } from "fs/promises"

export const TOURNAMENT_IMAGES_FOLDER = "uploads/tournaments"
export const AVATAR_FOLDER = "uploads/avatar"
export const LAN_MAP_FOLDER = "uploads"

const tournamentImageSize = [1098, 600]
const avatarSize = [256, 256]

export async function storePicture(file: File, location: string): Promise<string> {
  const inputBuffer = Buffer.from(await file.arrayBuffer())
  let filename = "lanMap.webp"
  if ([TOURNAMENT_IMAGES_FOLDER, AVATAR_FOLDER].includes(location)) {
    const hashSum = crypto.createHash("md5")
    const hex = hashSum.update(inputBuffer as NodeJS.ArrayBufferView).digest("hex")
    filename = `${hex}.webp`
  }
  logger.debug("storing picture " + file.name + " as " + filename)
  await mkdir(location, { recursive: true })
  try {
    let sharpOut = sharp(inputBuffer, { pages: -1 })
    if ([TOURNAMENT_IMAGES_FOLDER, AVATAR_FOLDER].includes(location)) {
      const size = location == AVATAR_FOLDER ? avatarSize : tournamentImageSize
      sharpOut = sharpOut.resize(size[0], size[1], {
        fit: "cover",
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
    }
    await sharpOut.toFile(`${location}/${filename}`)
  } catch (e) {
    logger.error(e)
    throw e
  }

  return filename
}
