import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [remix({
      routes(defineRoutes) {
        return defineRoutes((route) => {
          route("/", "pages/index.tsx", { index: true });
          route("sse", "api/sse.ts", { index: true });
          route("login", "pages/login/layout.tsx", () => {
            route("", "pages/login/index/index.tsx", { index:true})
            route("step-new-password", "pages/login/step-new-password/step-new-password.tsx")
            route("step-password", "pages/login/step-password/step-password.tsx")
          });
          route("admin", "pages/admin/admin.tsx")
          route("admin/add-games", "pages/admin/add-games/add-games.tsx")
          route("admin/login", "pages/admin/login/login.tsx")
          // route("about", "about/route.tsx");
          // route("concerts", "concerts/layout.tsx", () => {
          //   route("", "concerts/home.tsx", { index: true });
          //   route("trending", "concerts/trending.tsx");
          //   route(":city", "concerts/city.tsx");
          // });
        });
      },
    }), tsconfigPaths()],
  server: {
    proxy: {
      '/igdb_image' : {
        target: 'https://images.igdb.com/igdb/image/upload',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/igdb_image/, ''),
      }
    }
  }
});
