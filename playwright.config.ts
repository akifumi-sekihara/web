import { defineConfig } from "@playwright/test";

export default defineConfig({
  reporter: [["list"], ["html", { open: "never" }]],
  testDir: "./tests/browser",
  use: { baseURL: "http://127.0.0.1:8787", trace: "retain-on-failure" },
  webServer: {
    command: "pnpm exec wrangler dev --ip 127.0.0.1 --port 8787",
    reuseExistingServer: process.env.CI !== "true",
    url: "http://127.0.0.1:8787/en/",
  },
});
