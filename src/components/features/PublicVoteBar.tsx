"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { VOTE_BUNDLE_THRESHOLD } from "@/lib/constants";

interface VoteData {
  total: number;
  ja: number | null;
  nej: number | null;
  thresholdReached: boolean;
}

interface PublicVoteBarProps {
  variant?: "default" | "hero";
}

export default function PublicVoteBar({ variant = "default" }: PublicVoteBarProps) {
  const [data, setData] = useState<VoteData | null>(null);
  const t = useTranslations("results");
  const vc = useTranslations("voteCounter");
  const h = useTranslations("home");

  const isHero = variant === "hero";

  useEffect(() => {
    fetch("/api/votes/count")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data || data.total === 0) return null;

  // Below threshold
  if (!data.thresholdReached || data.ja === null || data.nej === null) {
    return (
      <div className={`rounded-lg bg-gray-50 px-3 py-2 ${isHero ? "mb-0" : "mb-4"}`}>
        <p className="text-sm text-gray-500">
          {isHero
            ? h("resultsPending")
            : `${data.total} ${data.total === 1 ? vc("singular") : vc("plural")}. ${t("belowThreshold", { threshold: VOTE_BUNDLE_THRESHOLD })}`}
        </p>
      </div>
    );
  }

  // Above threshold — show percent bar
  const total = data.ja + data.nej;
  const pct = Math.round((data.ja / total) * 100);

  return (
    <div className={isHero ? "mb-0" : "mb-4"}>
      {!isHero && (
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {t("publicVotesTitle")}
        </h3>
      )}
      <div className="rounded-lg bg-gray-50 px-3 py-2.5">
        <div className={`flex justify-between font-semibold mb-1 ${isHero ? "text-base" : "text-sm"}`}>
          <span className="text-melon-green">
            {pct}% {t("yes")}
          </span>
          <span className="text-melon-red">
            {100 - pct}% {t("no")}
          </span>
        </div>
        <div className={`${isHero ? "h-3.5" : "h-2.5"} rounded-full bg-gray-200 overflow-hidden flex`}>
          <div
            className="bg-melon-green transition-all"
            style={{ width: `${pct}%` }}
          />
          <div
            className="bg-melon-red transition-all"
            style={{ width: `${100 - pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
