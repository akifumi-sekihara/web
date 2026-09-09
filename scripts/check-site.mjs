/* oxlint-disable no-await-in-loop, unicorn/no-await-expression-member -- Bound I/O concurrency during whole-site verification. */
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { HtmlValidate } from "html-validate";

const root = path.resolve("apps/portfolio/dist");
const validator = new HtmlValidate({
  extends: ["html-validate:recommended"],
  rules: { "void-style": "off", "wcag/h32": "off" },
});
/** @param {string} dir @returns {Promise<string[]>} */
const files = async (dir) => {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    result.push(...(item.isDirectory() ? await files(file) : [file]));
  }
  return result;
};
const output = await files(root);
for (const file of output.filter((candidate) => candidate.endsWith(".html"))) {
  const html = await readFile(file, "utf-8");
  const report = await validator.validateString(html, file);
  assert.equal(report.valid, true, JSON.stringify(report.results, null, 2));
  for (const [, ref] of html.matchAll(/(?:href|src)="(?<ref>[^"]+)"/gu)) {
    if (
      ref === undefined ||
      ref === "" ||
      /^(?:https?:|mailto:|data:)/u.test(ref)
    ) {
      continue;
    }
    const url = new URL(ref, `https://local.test/${path.relative(root, file)}`);
    let target = path.join(root, decodeURIComponent(url.pathname));
    if (url.pathname.endsWith("/")) {
      target = path.join(target, "index.html");
    }
    await stat(target);
    if (url.hash !== "" && target.endsWith(".html")) {
      const linked = await readFile(target, "utf-8");
      assert.ok(
        linked.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),
        `Missing anchor: ${ref} in ${file}`
      );
    }
  }
}
assert.ok(
  output.length < 19_000,
  "Static asset count approaches hosting limits; review plan."
);
for (const file of output) {
  assert.ok(
    (await stat(file)).size < 25 * 1024 * 1024,
    `Oversized asset: ${file}`
  );
}
const entries = await readdir("apps/portfolio/src/content/projects");
/** @type {Map<string, string[]>} */
const groups = new Map();
for (const file of entries) {
  /** @type {unknown} */
  const data = JSON.parse(
    await readFile(
      path.join("apps/portfolio/src/content/projects", file),
      "utf-8"
    )
  );
  assert.ok(typeof data === "object" && data !== null);
  assert.ok("translationId" in data && typeof data.translationId === "string");
  assert.ok("locale" in data && typeof data.locale === "string");
  const group = groups.get(data.translationId) ?? [];
  group.push(data.locale);
  groups.set(data.translationId, group);
}
for (const languages of groups.values()) {
  assert.deepEqual(languages.toSorted(), ["en", "ja", "ko", "zh-cn"]);
}
console.log(
  `Validated HTML, internal links, translations and sizes: ${output.length} files.`
);
