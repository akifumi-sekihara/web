import assert from "node:assert/strict";
import { test } from "node:test";

import { negotiateLanguage } from "../apps/portfolio/src/lib/locales.ts";
import worker from "../worker/index.ts";

await test("language negotiation uses quality, regional matches, and English fallback", () => {
  for (const [header, expected] of [
    ["ja-JP,en;q=0.8", "ja"],
    ["en-GB", "en"],
    ["ko-KR", "ko"],
    ["zh-TW", "zh-cn"],
    ["zh-Hans-CN", "zh-cn"],
    ["de,ko;q=0.8", "ko"],
    ["ja;q=0.2,en;q=0.9", "en"],
    ["ja;q=0,ko;q=0.7", "ko"],
    ["fr,de", "en"],
    ["*", "en"],
    ["ja;q=NaN,ko;q=2", "en"],
    ["", "en"],
  ]) {
    assert.equal(negotiateLanguage(header ?? null), expected, header);
  }
  assert.equal(negotiateLanguage(null), "en");
});
await test("root redirects without caching; explicit language URL goes to static assets", async () => {
  const env = {
    ASSETS: {
      fetch: async () => await Promise.resolve(new Response("static")),
    },
  };
  const response = await worker.fetch(
    new Request("https://example.com/?ref=test", {
      headers: { "Accept-Language": "ko" },
    }),
    env
  );
  assert.equal(response.status, 302);
  assert.equal(
    response.headers.get("Location"),
    "https://example.com/ko/?ref=test"
  );
  assert.equal(response.headers.get("Vary"), "Accept-Language");
  assert.match(response.headers.get("Cache-Control") ?? "", /no-store/u);
  const explicit = await worker.fetch(
    new Request("https://example.com/ja/", {
      headers: { "Accept-Language": "en" },
    }),
    env
  );
  assert.equal(await explicit.text(), "static");
});
