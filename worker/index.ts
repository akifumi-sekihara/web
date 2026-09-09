import { negotiateLanguage } from "../apps/portfolio/src/lib/locales.ts";

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      url.pathname = `/${negotiateLanguage(request.headers.get("Accept-Language"))}/`;
      return new Response(null, {
        headers: {
          "Cache-Control": "private, no-store",
          Location: url.href,
          Vary: "Accept-Language",
          "X-Content-Type-Options": "nosniff",
        },
        status: 302,
      });
    }
    return await env.ASSETS.fetch(request);
  },
};
