// @ts-check
import sitemap from "@astrojs/sitemap";
import stylex from "@stylexjs/unplugin";
import { defineConfig } from "astro/config";

export default defineConfig({
  build: { inlineStylesheets: "never" },
  i18n: {
    defaultLocale: "en",
    locales: ["ja", "en", "ko", "zh-cn"],
    routing: { prefixDefaultLocale: true },
  },
  integrations: [
    sitemap({
      filter: (url) => /\/(?:ja|en|ko|zh-cn)\/$/u.test(url),
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", ja: "ja", ko: "ko", "zh-cn": "zh-Hans" },
      },
    }),
  ],
  output: "static",
  site: process.env.SITE_URL ?? "https://portfolio.sekihara.dev",
  // The package exposes vite on its default export, but not in its named-export types.
  vite: {
    // oxlint-disable-next-line import/no-named-as-default-member
    plugins: [stylex.vite({ runtimeInjection: false, useCSSLayers: false })],
  },
});
