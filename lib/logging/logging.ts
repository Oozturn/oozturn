import { NextApiHandler } from "next";
import pino, { Logger } from "pino";

export const logger = pino();

declare module "http" {
    interface IncomingMessage {
        /** Added by logging.ts */
        logger: Logger;
    }
}

export function withLogger(
    handler: NextApiHandler,
): NextApiHandler {
    return async function nextApiHandlerWrappedWithLogger(req, res) {
        let childLogger = logger.child({
            username:req.session.user?.username,
            ip: req.socket.remoteAddress
        })
        req.logger = childLogger
        return handler(req, res);
    };
}