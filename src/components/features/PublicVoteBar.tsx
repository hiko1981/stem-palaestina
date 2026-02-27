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

export default function PublicVoteBar() {
  const [data, setData] = useState<VoteData | null>(null);
  const t = useTranslations("results");
  const vc = useTranslations("voteCounter");

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
      <div className="rounded-lg bg-gray-50 px-3 py-2 mb-4">
        <p className="text-sm text-gray-500">
          {data.total} {data.total === 1 ? vc("singular") : vc("plural")}.{" "}
          {t("belowThreshold", { threshold: VOTE_BUNDLE_THRESHOLD })}
        </p>
      </div>
    );
  }

  // Above threshold — show percent bar
  const total = data.ja + data.nej;
  const pct = Math.round((data.ja / total) * 100);

  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2.5 mb-4">
      <div className="flex justify-between text-sm font-semibold mb-1">
        <span className="text-melon-green">
          {pct}% {t("yes")}
        </span>
        <span className="text-melon-red">
          {100 - pct}% {t("no")}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden flex">
        <div
          className="bg-melon-green transition-all"
          style={{ width: `${pct}%` }}
        />
        <div
          className="bg-melon-red transition-all"
          style={{ width: `${100 - pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {data.ja} {t("yes").toLowerCase()} &middot; {data.nej}{" "}
        {t("no").toLowerCase()} &middot; {total} {vc("plural")}
      </p>
    </div>
  );
}
