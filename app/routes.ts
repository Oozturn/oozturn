import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
    route("sse", "api/sse.ts"),
    route("api", "api/api.ts"),
    index("pages/index.tsx",),
    route("login", "pages/login/layout.tsx", [
        index("pages/login/login.tsx"),
        route("step-new-password", "pages/login/step-new-password/step-new-password.tsx"),
        route("step-password", "pages/login/step-password/step-password.tsx"),
        route("first-login", "pages/login/first-login.tsx")
    ]),
    route("logout", "pages/logout.ts"),
    route("admin", "pages/admin/admin.tsx"),
    route("admin/login", "pages/admin/login/admin-login.tsx"),
    route("tournaments", "pages/tournaments/layout.tsx", [
        index("pages/tournaments/tournaments.tsx"),
        route("404", "pages/tournaments/404.tsx"),
        route(":id", "pages/tournaments/$id/tournament.tsx"),
        route("api", "pages/tournaments/api.ts")
    ]),
    route("tournaments/new", "pages/tournaments/new/new.tsx"),
    route("tournaments/edit/:id", "pages/tournaments/edit/edit.tsx"),
    route("info", "pages/info/info.tsx"),
    route("info/users", "pages/info/users/users.tsx"),
    route("results", "pages/results/results.tsx"),
    route("*", "pages/404.tsx"),
] satisfies RouteConfig;
