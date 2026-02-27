"use client";

import { useEffect } from "react";
import { locales } from "@/i18n/config";

export default function LangMissLogger() {
  useEffect(() => {
    const key = "stem_lang_miss_logged";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const browserLang = navigator.language?.split("-")[0]?.toLowerCase();
    if (!browserLang) return;
    if ((locales as readonly string[]).includes(browserLang)) return;

    // Language not supported — log it
    fetch("/api/admin/lang-miss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: browserLang }),
    }).catch(() => {});
  }, []);

  return null;
}
