"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import CountryCodeSelect from "@/components/features/CountryCodeSelect";
import Button from "@/components/ui/Button";

type Mode = null | "sms" | "email";

export default function SharePanel() {
  const [mode, setMode] = useState<Mode>(null);
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("+45");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const t = useTranslations("sharePanel");

  const handleDialCode = useCallback((code: string) => {
    setDialCode(code);
  }, []);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://stem-palaestina.vercel.app";

  async function handleSendSms() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ballot/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, dialCode }),
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

  function handleSendEmail() {
    const subject = encodeURIComponent(t("emailSubject"));
    const body = encodeURIComponent(`${t("emailBody")}\n\n${baseUrl}`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_self");
    setSent(true);
    setEmail("");
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(baseUrl).then(() => {
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
              <div className="flex gap-2">
                <CountryCodeSelect value={dialCode} onChange={handleDialCode} />
                <input
                  type="tel"
                  placeholder="12345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleSendSms}
                loading={loading}
                disabled={!phone}
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
              <input
                type="email"
                placeholder={t("emailLabel")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
                autoFocus
              />
              <Button
                onClick={handleSendEmail}
                disabled={!email}
                className="w-full"
              >
                {t("send")}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Copy link option */}
      <button
        onClick={handleCopyLink}
        className="w-full text-left rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-colors hover:bg-gray-50"
      >
        <span className="font-semibold">
          {copied ? t("copied") : t("shareLink")}
        </span>
        <span className="block text-xs text-gray-500 mt-0.5">
          {t("shareLinkDesc")}
        </span>
      </button>
    </div>
  );
}
