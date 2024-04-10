import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [remix(), tsconfigPaths()],
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
