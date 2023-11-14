import { YogaInitialContext } from "graphql-yoga";
import { IncomingMessage } from "http";

export interface GraphQLContext extends YogaInitialContext {
    /** Added by withIronSessionApiRoute */
    req: IncomingMessage
}