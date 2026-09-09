/* oxlint-disable no-await-in-loop, unicorn/no-await-expression-member -- Browser steps must be sequential. */
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const locale of ["ja", "en", "ko", "zh-cn"]) {
  test(`${locale}: language, SEO, image and accessibility`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/`);
    await expect(page.locator("html")).toHaveAttribute(
      "lang",
      locale === "zh-cn" ? "zh-Hans" : locale
    );
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(
      5
    );
    await expect(page.locator("picture source")).toHaveCount(2);
    await expect(page.locator("picture img")).toBeVisible();
    const schema: unknown = JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) ?? ""
    );
    expect(schema).toMatchObject({ mainEntity: { name: "Akifumi Sekihara" } });
    await page.getByRole("link", { exact: true, name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/$/u);
    await page.goto(`/${locale}/`);
    for (const width of [360, 1280]) {
      await page.setViewportSize({ height: 900, width });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  });
}
test("HTTP language routing, root fallback, and real 404", async ({
  request,
}) => {
  for (const [language, expected] of [
    ["ja-JP", "ja"],
    ["en", "en"],
    ["ko-KR", "ko"],
    ["zh-CN", "zh-cn"],
    ["fr-FR", "en"],
  ]) {
    const response = await request.get("/", {
      headers: { "Accept-Language": language ?? "" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(302);
    expect(response.headers().location).toContain(`/${expected}/`);
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
  expect((await request.get("/missing-page")).status()).toBe(404);
  const response = await request.get("/ja/");
  expect(response.headers()["content-security-policy"]).toContain(
    "script-src 'none'"
  );
});
