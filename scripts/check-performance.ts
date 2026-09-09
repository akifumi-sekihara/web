/* oxlint-disable no-await-in-loop -- Lighthouse runs sequentially to avoid measurement contention. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";

import { chromium } from "@playwright/test";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const server = spawn("pnpm", ["exec", "wrangler", "dev", "--port", "8788"], {
  detached: true,
  stdio: "ignore",
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:8788/en/");
      ready = response.ok;
    } catch {
      // Wrangler is still starting.
    }
    if (ready) {
      break;
    }
    await setTimeout(1000);
  }
  assert.ok(ready, "Local Worker failed to start");
  await mkdir(".lighthouseci/reports", { recursive: true });
  const chrome = await launch({
    chromeFlags: ["--headless", "--no-sandbox"],
    chromePath: chromium.executablePath(),
  });
  try {
    for (const locale of ["en", "ja", "ko", "zh-cn"]) {
      const result = await lighthouse(`http://127.0.0.1:8788/${locale}/`, {
        logLevel: "error",
        onlyCategories: ["performance", "accessibility", "seo"],
        output: "html",
        port: chrome.port,
      });
      assert.ok(result);
      assert.ok(
        !result.lhr.runtimeError,
        JSON.stringify(result.lhr.runtimeError)
      );
      await writeFile(`.lighthouseci/reports/${locale}.html`, result.report);
      const scores = Object.fromEntries(
        Object.entries(result.lhr.categories).map(([name, value]) => [
          name,
          value.score ?? 0,
        ])
      );
      console.log(locale, scores);
      assert.ok(
        (scores.accessibility ?? 0) >= 0.95,
        "Accessibility score below 0.95"
      );
      if ((scores.performance ?? 0) < 0.9 || (scores.seo ?? 0) < 0.9) {
        console.warn(`Review performance/SEO report for ${locale}`);
      }
    }
  } finally {
    chrome.kill();
  }
} finally {
  if (server.pid !== undefined) {
    process.kill(-server.pid, "SIGTERM");
  }
}
