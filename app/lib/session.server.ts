import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { getLan } from "./persistence/lan.server";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
    throw new Error("SESSION_SECRET must be set");
}

const secureStorage =
    createCookieSessionStorage(
        {
            // a Cookie from `createCookie` or the CookieOptions to create one
            cookie: {
                name: "oozturn_session",
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 7,
                path: "/",
                sameSite: "lax",
                secrets: [sessionSecret],
                secure: process.env.NODE_ENV === "production",
            },
        }
    );

async function getSession(request: Request) {
    return await secureStorage.getSession(
        request.headers.get("Cookie")
    );
}

export async function createSessionWithUsername(username: string) {
    const session = await secureStorage.getSession();
    session.set("username", username);
    session.set("auth", "username");
    return await secureStorage.commitSession(session)
}

export async function destroySession(request: Request) {
    const session = await getSession(request);
    return await secureStorage.destroySession(session)
}

export async function updateSessionWithAdminElevation(request: Request) {
    const session = await getSession(request)
    session.set("admin", true);
    return await secureStorage.commitSession(session)
}

export async function updateSessionWithPasswordAuth(request: Request) {
    const session = await getSession(request)
    session.set("auth", "password");
    return await secureStorage.commitSession(session)
}

export async function isUserLoggedIn(request: Request) {
    const session = await getSession(request)
    if (getLan().authenticationNeeded) {
        return session.has("username")
            && session.get("auth") === "password"
    }
    return session.has("username")
}

export async function isUserAdmin(request: Request): Promise<boolean> {
    const session = await getSession(request)
    return !!session.get("admin")
}

export async function getUsername(request: Request): Promise<string | undefined> {
    const session = await getSession(request)
    return session.get("username")
}

export async function requireUserLoggedIn(request: Request) {
    const userLoggedIn = await isUserLoggedIn(request)
    if (!userLoggedIn) {
        throw redirect('/login');
    }
}

export async function requireUserAdmin(request: Request) {
    const userIdAdmin = await isUserAdmin(request)
    if (!userIdAdmin) {
        throw redirect('/admin/login');
    }
}