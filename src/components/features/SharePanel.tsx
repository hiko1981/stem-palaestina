"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import CountryCodeSelect from "@/components/features/CountryCodeSelect";
import Button from "@/components/ui/Button";
import PhoneNote from "@/components/ui/PhoneNote";
import { locales, localeNames, type Locale } from "@/i18n/config";

type Mode = null | "sms" | "email";

function LocaleSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-300 px-2 py-2 text-sm bg-white focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeNames[loc]}
        </option>
      ))}
    </select>
  );
}

export default function SharePanel() {
  const [mode, setMode] = useState<Mode>(null);
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("+45");
  const [email, setEmail] = useState("");
  const [smsLocale, setSmsLocale] = useState<string>("da");
  const [emailLocale, setEmailLocale] = useState<string>("da");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const t = useTranslations("sharePanel");

  const handleDialCode = useCallback((code: string) => {
    setDialCode(code);
  }, []);

  async function handleSendSms() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ballot/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, dialCode, locale: smsLocale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSent(true);
      setPhone("");
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSendEmail() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/share/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale: emailLocale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSent(true);
      setEmail("");
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  function getBaseUrl() {
    return typeof window !== "undefined"
      ? window.location.origin
      : "https://stem-palaestina.vercel.app";
  }

  async function handleShare() {
    const url = getBaseUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: "Stem Palæstina", url });
      } catch {
        // User cancelled share — ignore
      }
    } else {
      handleCopyLink();
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(getBaseUrl()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function resetMode(newMode: Mode) {
    if (mode === newMode) {
      setMode(null);
    } else {
      setMode(newMode);
      setSent(false);
      setError("");
      setPhone("");
      setEmail("");
    }
  }

  return (
    <div className="space-y-2">
      {/* SMS option */}
      <button
        onClick={() => resetMode("sms")}
        className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-colors ${
          mode === "sms"
            ? "border-melon-green bg-melon-green/5"
            : "border-gray-200 hover:bg-gray-50"
        }`}
      >
        <span className="font-semibold">{t("sendSms")}</span>
        <span className="block text-xs text-gray-500 mt-0.5">
          {t("sendSmsDesc")}
        </span>
      </button>

      {mode === "sms" && (
        <div className="px-1 space-y-2 animate-in slide-in-from-top-2">
          {sent ? (
            <p className="text-sm text-melon-green font-medium text-center py-1">
              {t("sent")}
            </p>
          ) : (
            <>
              <div className="flex gap-2 min-w-0">
                <CountryCodeSelect value={dialCode} onChange={handleDialCode} />
                <input
                  type="tel"
                  placeholder="12345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
                  autoFocus
                />
                <LocaleSelect value={smsLocale} onChange={setSmsLocale} />
              </div>
              <Button
                onClick={handleSendSms}
                loading={loading}
                disabled={!phone}
                className="w-full"
              >
                {t("send")}
              </Button>
              <PhoneNote />
              {error && (
                <p className="text-center text-xs text-melon-red">{error}</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Email option */}
      <button
        onClick={() => resetMode("email")}
        className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-colors ${
          mode === "email"
            ? "border-melon-green bg-melon-green/5"
            : "border-gray-200 hover:bg-gray-50"
        }`}
      >
        <span className="font-semibold">{t("sendEmail")}</span>
        <span className="block text-xs text-gray-500 mt-0.5">
          {t("sendEmailDesc")}
        </span>
      </button>

      {mode === "email" && (
        <div className="px-1 space-y-2 animate-in slide-in-from-top-2">
          {sent ? (
            <p className="text-sm text-melon-green font-medium text-center py-1">
              {t("sent")}
            </p>
          ) : (
            <>
              <div className="flex gap-2 min-w-0">
                <input
                  type="email"
                  placeholder={t("emailLabel")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
                  autoFocus
                />
                <LocaleSelect value={emailLocale} onChange={setEmailLocale} />
              </div>
              <Button
                onClick={handleSendEmail}
                loading={loading}
                disabled={!email}
                className="w-full"
              >
                {t("send")}
              </Button>
              {error && (
                <p className="text-center text-xs text-melon-red">{error}</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Share + Copy link */}
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="flex-1 text-left rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-colors hover:bg-gray-50"
        >
          <span className="font-semibold">{t("shareLink")}</span>
          <span className="block text-xs text-gray-500 mt-0.5">
            {t("shareLinkDesc")}
          </span>
        </button>
        <button
          onClick={handleCopyLink}
          className="shrink-0 rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 flex items-center"
        >
          <span className="font-semibold">
            {copied ? t("copied") : t("copyLink")}
          </span>
        </button>
      </div>
    </div>
  );
}
