export const locales = [
  "da", "en", "zh", "hi", "es", "ar", "fr", "bn", "pt", "ru",
  "ur", "id", "de", "ja", "sw", "vi", "tr", "ko", "ta", "th",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "da";

export const localeNames: Record<Locale, string> = {
  da: "Dansk",
  en: "English",
  zh: "中文",
  hi: "हिन्दी",
  es: "Español",
  ar: "العربية",
  fr: "Français",
  bn: "বাংলা",
  pt: "Português",
  ru: "Русский",
  ur: "اردو",
  id: "Indonesia",
  de: "Deutsch",
  ja: "日本語",
  sw: "Kiswahili",
  vi: "Tiếng Việt",
  tr: "Türkçe",
  ko: "한국어",
  ta: "தமிழ்",
  th: "ไทย",
};

export const rtlLocales: Locale[] = ["ar", "ur"];
