"use client";

import { useEffect, useState } from "react";
import { getDialCodeList } from "@/lib/phone";
import { useTranslations } from "next-intl";

interface CountryCodeSelectProps {
  value: string;
  onChange: (code: string) => void;
}

const dialCodes = getDialCodeList();

export default function CountryCodeSelect({
  value,
  onChange,
}: CountryCodeSelectProps) {
  const [autoDetected, setAutoDetected] = useState(false);
  const t = useTranslations("countryCode");

  useEffect(() => {
    if (autoDetected) return;
    fetch("/api/geo/country")
      .then((res) => res.json())
      .then((data) => {
        if (data.dialCode) {
          onChange(data.dialCode);
          setAutoDetected(true);
        }
      })
      .catch(() => {});
  }, [autoDetected, onChange]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-lg focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
      aria-label={t("label")}
    >
      {dialCodes.map(({ country, code }) => (
        <option key={`${country}-${code}`} value={code}>
          {country} {code}
        </option>
      ))}
    </select>
  );
}
