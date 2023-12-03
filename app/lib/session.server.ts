import { createCookieSessionStorage, redirect } from "@remix-run/node";

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
                maxAge: 60,
                path: "/",
                sameSite: "lax",
                secrets: [sessionSecret],
                secure: process.env.NODE_ENV === "production",
            },
        }
    );


export async function createSessionWithUsername(username: string) {
    const session = await secureStorage.getSession();
    session.set("username", username);
    return await secureStorage.commitSession(session)
}

export async function isUserLoggedIn(request: Request) {
    const session = await secureStorage.getSession(
        request.headers.get("Cookie")
    );

    return session.has("username")
}