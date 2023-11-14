import sharp from 'sharp'
import fs from 'fs'
import crypto from 'crypto'
import { mkdir } from 'fs/promises';
 

export async function processAvatar(file: File): Promise<string> {
    const inputBuffer = Buffer.from(await file.arrayBuffer())
    const hashSum = crypto.createHash('md5');
    hashSum.update(inputBuffer);
    const hex = hashSum.digest('hex');
    const filename = `${hex}.webp`
    await mkdir('uploads/avatar', { recursive: true })
    try {
        await sharp(inputBuffer, {animated:true, pages: -1})
        .resize(256,256, {fit: 'contain', background: {r: 0, g: 0, b: 0, alpha: 0}})
        .toFile(`uploads/avatar/${filename}`)
    } catch (e) {
        console.error(e)
        throw e
    }
    return filename
}

export async function deleteOldAvatar(filename: string) {
    try {
        await fs.promises.rm(`uploads/avatar/${filename}`)
    } catch(e) {
        console.error(e)
    }
    
}