"use client";

import { useState, useEffect } from "react";
import { STORKREDSE } from "@/lib/storkredse";
import { useTranslations } from "next-intl";

interface ConstituencyPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ConstituencyPicker({
  value,
  onChange,
}: ConstituencyPickerProps) {
  const [autoDetected, setAutoDetected] = useState(false);
  const t = useTranslations("constituency");
  const s = useTranslations("storkredse");

  useEffect(() => {
    if (value) return; // Already has a value
    fetch("/api/geo/country")
      .then((res) => res.json())
      .then((data) => {
        if (data.storkreds) {
          onChange(data.storkreds);
          setAutoDetected(true);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {t("label")}
        {autoDetected && value && (
          <span className="ml-1 text-xs text-gray-400 font-normal">
            {t("autoDetected")}
          </span>
        )}
      </label>
      <select
        className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-melon-green focus:outline-none"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setAutoDetected(false);
        }}
      >
        <option value="">{t("placeholder")}</option>
        {STORKREDSE.map((sk) => (
          <option key={sk.id} value={sk.id}>
            {s(sk.id)}
          </option>
        ))}
      </select>
    </div>
  );
}
