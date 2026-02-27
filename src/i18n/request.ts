import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { locales, defaultLocale, type Locale } from "./config";

function parseAcceptLanguage(header: string): string[] {
  return header
    .split(",")
    .map((part) => {
      const [lang, q] = part.trim().split(";q=");
      return { lang: lang.trim().split("-")[0].toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q)
    .map((x) => x.lang);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("locale")?.value;

  // 1. Cookie set → use it
  if (locales.includes(raw as Locale)) {
    const locale = raw as Locale;
    const messages = (await import(`../messages/${locale}.json`)).default;
    return { locale, messages };
  }

  // 2. Parse Accept-Language header
  const headerStore = await headers();
  const acceptLang = headerStore.get("accept-language") || "";
  const preferred = parseAcceptLanguage(acceptLang);

  const matched = preferred.find((lang) =>
    locales.includes(lang as Locale),
  );

  const locale: Locale = matched ? (matched as Locale) : defaultLocale;
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
