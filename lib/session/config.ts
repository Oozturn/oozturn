import { IronSessionOptions } from "iron-session";
import { flattenDiagnosticMessageText } from "typescript";

export interface IronUser {
    username: string;
    isAdmin: boolean;
}

declare module "iron-session" {
    interface IronSessionData {
        user?: IronUser
    }
}

export const cookieName = "lanhelper_session"

export const ironOptions: IronSessionOptions = {
    cookieName: cookieName,
    password: process.env.SESSION_SECRET as string,
    // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
    cookieOptions: {
        secure: false,
        sameSite: "lax",
        httpOnly: false
    },
};