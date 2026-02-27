"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface VoteData {
  total: number;
  ja: number | null;
  nej: number | null;
  thresholdReached: boolean;
  candidateCount: number;
}

interface VoteCounterProps {
  variant?: "default" | "full";
}

export default function VoteCounter({ variant = "default" }: VoteCounterProps) {
  const [data, setData] = useState<VoteData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const t = useTranslations("voteCounter");

  useEffect(() => {
    fetch("/api/votes/count")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || data === null) return null;

  if (variant === "full") {
    const jaPercent =
      data.thresholdReached && data.ja !== null && data.total > 0
        ? Math.round((data.ja / data.total) * 100)
        : null;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-4xl font-extrabold">
            {data.total.toLocaleString("da-DK")}
          </p>
          <p className="text-sm text-gray-500">
            {data.total === 1 ? t("singular") : t("plural")}
          </p>
        </div>
        {data.thresholdReached && jaPercent !== null && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-melon-green">
                {t("yes")} {data.ja?.toLocaleString("da-DK")}
              </span>
              <span className="text-melon-red">
                {t("no")} {data.nej?.toLocaleString("da-DK")}
              </span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex">
              <div
                className="h-full bg-melon-green rounded-l-full transition-all"
                style={{ width: `${jaPercent}%` }}
              />
              <div
                className="h-full bg-melon-red rounded-r-full transition-all"
                style={{ width: `${100 - jaPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <span className="text-sm text-gray-400">
      {data.total.toLocaleString("da-DK")}{" "}
      {data.total === 1 ? t("singular") : t("plural")}
    </span>
  );
}
