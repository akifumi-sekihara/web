export const locales = ["ja", "en", "ko", "zh-cn"] as const;
export type Locale = (typeof locales)[number];
export const languageNames: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
  ko: "한국어",
  "zh-cn": "简体中文",
};
export const languageTags: Record<Locale, string> = {
  en: "en",
  ja: "ja",
  ko: "ko",
  "zh-cn": "zh-Hans",
};

/** Choose the first supported language with positive quality; otherwise English. */
export const negotiateLanguage = (header: string | null): Locale => {
  const preferences = (header ?? "")
    .split(",")
    .map((item, order) => {
      const [range = "", ...parameters] = item.trim().toLowerCase().split(";");
      const quality = parameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.startsWith("q="));
      const q = quality === undefined ? 1 : Number(quality.slice(2));
      return { order, q, range: range.trim() };
    })
    .filter(
      ({ range, q }) =>
        /^[a-z]{2,8}(?:-[a-z0-9]{1,8})*$/u.test(range) &&
        Number.isFinite(q) &&
        q > 0 &&
        q <= 1
    )
    .toSorted((a, b) => b.q - a.q || a.order - b.order);
  for (const { range } of preferences) {
    const [base] = range.split("-");
    if (base === "zh") {
      return "zh-cn";
    }
    if (base === "ja" || base === "en" || base === "ko") {
      return base;
    }
  }
  return "en";
};
