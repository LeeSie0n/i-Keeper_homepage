import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())};

  return {
    plugins: [react(), tsconfigPaths()],
    server: {
      proxy: {
        "/openapi": {
          target: "https://apis.data.go.kr/",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/openapi/, ""),
        },
        "/api": {
          target: process.env.VITE_BACKEND_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
});