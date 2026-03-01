"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FT2026_LATEST_DATE } from "@/lib/constants";

export default function FT2026Countdown() {
  const [days, setDays] = useState<number | null>(null);
  const t = useTranslations("countdown");

  useEffect(() => {
    const now = new Date();
    const diff = FT2026_LATEST_DATE.getTime() - now.getTime();
    setDays(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
  }, []);

  if (days === null) return null;

  return (
    <div className="text-center">
      <p className="text-2xl font-extrabold tabular-nums">{days}</p>
      <p className="text-xs text-gray-500">{t("daysUntil")}</p>
    </div>
  );
}
