import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";

// 백엔드 CORS 허용 목록에 이 앱 origin이 없어서, 개발 서버가 같은 origin에서 프록시합니다.
// VITE_API_*_URL(경로 접두사)과 VITE_PROXY_*_URL(실제 주소)이 둘 다 있는 백엔드만 프록시합니다.
const BACKENDS = ["SERVER", "MEMBER", "SOCIAL", "AUTH"] as const;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const proxy: Record<string, ProxyOptions> = {};
  for (const name of BACKENDS) {
    const prefix = env[`VITE_API_${name}_URL`];
    const target = env[`VITE_PROXY_${name}_URL`];
    if (!prefix || !target) continue;
    proxy[prefix] = {
      target,
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.slice(prefix.length),
      // v2와 동일: Origin·Referer가 남아 있으면 백엔드가 CORS로 거부합니다.
      configure: (server) => {
        server.on("proxyReq", (req) => {
          req.removeHeader("origin");
          req.removeHeader("referer");
        });
        // 세션 쿠키가 `Secure; SameSite=None`이라 http인 내 IP 주소(--host)에서는 저장되지 않습니다.
        // 프록시로 같은 origin이 되므로 개발 서버에서만 Secure를 떼고 Lax로 바꿉니다.
        server.on("proxyRes", (res) => {
          res.headers["set-cookie"] = res.headers["set-cookie"]?.map((cookie) =>
            cookie
              .replace(/;\s*Secure/gi, "")
              .replace(/SameSite=None/gi, "SameSite=Lax"),
          );
        });
      },
    };
  }
  return {
    plugins: [react(), tailwindcss()],
    resolve: { tsconfigPaths: true },
    server: { proxy },
  };
});
