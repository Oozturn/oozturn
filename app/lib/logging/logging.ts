import pino, { Logger } from "pino"

export const logger = pino()

declare module "http" {
    interface IncomingMessage {
        /** Added by logging.ts */
        logger: Logger
    }
}

export function logErrorAndThrow(message: string) {
    logger.error(message)
    throw new Error(message)
}