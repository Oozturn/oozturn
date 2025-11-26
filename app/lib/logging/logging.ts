import { Logger } from "pino"
import { pinoLogger } from "logger"

export const logger = pinoLogger

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