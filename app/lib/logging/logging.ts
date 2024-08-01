import pino, { Logger } from "pino"

export const logger = pino()

declare module "http" {
    interface IncomingMessage {
        /** Added by logging.ts */
        logger: Logger
    }
}