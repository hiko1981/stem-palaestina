"use client";

import { useTranslations, useLocale } from "next-intl";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { useState, useRef, useEffect } from "react";

function HeaderCounter() {
  const [data, setData] = useState<{
    total: number;
    ja: number | null;
    nej: number | null;
    thresholdReached: boolean;
    candidateCount: number;
  } | null>(null);
  const t = useTranslations("voteCounter");

  useEffect(() => {
    fetch("/api/votes/count")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const parts: string[] = [];
  if (data.thresholdReached && data.ja !== null && data.nej !== null) {
    parts.push(`${data.ja} ${t("yes").toLowerCase()}`);
    parts.push(`${data.nej} ${t("no").toLowerCase()}`);
  } else {
    parts.push(
      `${data.total} ${data.total === 1 ? t("singular") : t("plural")}`
    );
  }
  if (data.candidateCount > 0) {
    parts.push(`${data.candidateCount}k`);
  }

  return (
    <span className="hidden sm:inline text-xs text-gray-400 tabular-nums">
      {parts.join(" · ")}
    </span>
  );
}

export default function TopBar() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function switchLocale(loc: Locale) {
    document.cookie = `locale=${loc};path=/;max-age=31536000;SameSite=Lax`;
    setOpen(false);
    window.location.reload();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 h-12">
        {/* Language picker (always visible) */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-gray-50 transition-colors"
            aria-label="Change language"
          >
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 uppercase">
              {locale}
            </span>
          </button>

          {open && (
            <div className="absolute start-0 top-full mt-1 z-[60] w-44 rounded-lg border border-gray-100 bg-white shadow-lg py-1 max-h-72 overflow-y-auto">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => switchLocale(loc)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    loc === locale
                      ? "bg-melon-green-light text-melon-green font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="uppercase text-[10px] font-bold text-gray-400 w-5">{loc}</span>
                  <span>{localeNames[loc]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Header counter */}
        <HeaderCounter />
      </nav>
    </header>
  );
}
