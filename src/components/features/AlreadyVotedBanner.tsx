"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function AlreadyVotedBanner() {
  const [dismissed, setDismissed] = useState(true); // hidden on SSR
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("alreadyVoted");

  useEffect(() => {
    setDismissed(sessionStorage.getItem("stem_banner_dismissed") === "1");
  }, []);

  if (dismissed) return null;

  function dismiss() {
    sessionStorage.setItem("stem_banner_dismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="bg-amber-50 border-b border-amber-100">
      <div className="mx-auto max-w-xl px-4">
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="flex w-full items-center justify-center gap-1.5 py-2 text-xs text-amber-700 hover:text-amber-900 transition-colors"
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t("question")}
          </button>
        ) : (
          <div className="py-3 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-amber-800">{t("question")}</p>
              <button
                onClick={dismiss}
                className="text-amber-400 hover:text-amber-600 text-lg leading-none shrink-0 -mt-0.5"
                aria-label="Luk"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              {t("explanation")}
            </p>
            <a
              href="/om#kryptering"
              className="inline-block text-xs font-medium text-amber-800 underline decoration-amber-300 hover:text-amber-900 hover:decoration-amber-500 transition-colors"
            >
              {t("cryptoLink")}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
