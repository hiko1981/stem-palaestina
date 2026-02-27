"use client";

import { useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CountryCodeSelect from "@/components/features/CountryCodeSelect";
import InviteSection from "@/components/features/InviteSection";
import { useTranslations } from "next-intl";
import PhoneNote from "@/components/ui/PhoneNote";

export default function BallotRequestForm() {
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("+45");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const t = useTranslations("ballot");

  const handleDialCode = useCallback((code: string) => {
    setDialCode(code);
  }, []);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ballot/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          dialCode,
          deviceId:
            typeof window !== "undefined"
              ? localStorage.getItem("stem_device_id") || undefined
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSent(true);
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-melon-green/10 mb-2">
          <svg
            className="h-8 w-8 text-melon-green"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold">{t("sentTitle")}</h2>
        <p className="text-gray-600">{t("sentText")}</p>
        <InviteSection />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 min-w-0">
        <CountryCodeSelect value={dialCode} onChange={handleDialCode} />
        <div className="min-w-0 flex-1">
          <Input
            id="phone"
            label={t("phoneLabel")}
            type="tel"
            placeholder="12345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>
      <Button
        onClick={handleSubmit}
        loading={loading}
        disabled={!phone}
        className="w-full"
      >
        {t("send")}
      </Button>
      <PhoneNote />
      {error && (
        <p className="text-center text-sm text-melon-red">{error}</p>
      )}
    </div>
  );
}
