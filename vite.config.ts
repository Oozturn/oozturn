import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [remix({
    routes(defineRoutes) {
      return defineRoutes((route) => {
        route("sse", "api/sse.ts");
        route("api", "api/api.ts");
        route("/", "pages/index.tsx", { index: true });
        route("login", "pages/login/layout.tsx", () => {
          route("", "pages/login/login.tsx", { index: true })
          route("step-new-password", "pages/login/step-new-password/step-new-password.tsx")
          route("step-password", "pages/login/step-password/step-password.tsx")
        });
        route("logout", "pages/logout.ts", { index: true });
        route("admin", "pages/admin/admin.tsx")
        route("admin/add-games", "pages/admin/add-games/add-games.tsx")
        route("admin/login", "pages/admin/login/admin-login.tsx")
        route("tournaments", "pages/tournaments/layout.tsx", () => {
          route("", "pages/tournaments/tournaments.tsx", { index: true })
          route("404", "pages/tournaments/404.tsx")
          route(":id", "pages/tournaments/$id/tournament.tsx")
        })
        route("tournaments/new", "pages/tournaments/new/new.tsx")
        route("tournaments/edit/:id", "pages/tournaments/edit/edit.tsx")
        route("users", "pages/users/users.tsx")
      });
    },
  }), tsconfigPaths()],
  server: {
    proxy: {
      '/igdb_image': {
        target: 'https://images.igdb.com/igdb/image/upload',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/igdb_image/, ''),
      }
    }
  }
});
