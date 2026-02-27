"use client";

import { useState, useCallback, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CountryCodeSelect from "@/components/features/CountryCodeSelect";
import { useTranslations } from "next-intl";

const MAX_INVITES = 3;
const STORAGE_KEY = "stem_palaestina_invites";

function getInviteCount(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
}

function incrementInviteCount() {
  const count = getInviteCount() + 1;
  localStorage.setItem(STORAGE_KEY, String(count));
  return count;
}

export default function InviteSection() {
  const [showSendForm, setShowSendForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("+45");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);
  const t = useTranslations("invite");

  useEffect(() => {
    setInviteCount(getInviteCount());
  }, []);

  const slotsLeft = MAX_INVITES - inviteCount;

  const handleDialCode = useCallback((code: string) => {
    setDialCode(code);
  }, []);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.origin + "/stem" : "https://stem-palaestina.vercel.app/stem";
    const shareData = {
      title: t("shareTitle"),
      text: t("shareText"),
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleSendBallot() {
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
      const newCount = incrementInviteCount();
      setInviteCount(newCount);
      setSent(true);
      setPhone("");
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSent(false);
    setShowSendForm(true);
    setError("");
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm font-medium text-gray-700">
        {t("title")}
      </p>

      <Button variant="outline" onClick={handleShare} className="w-full">
        {copied ? t("copied") : t("share")}
      </Button>

      {slotsLeft > 0 && !showSendForm && !sent && (
        <button
          onClick={() => setShowSendForm(true)}
          className="block w-full text-center text-sm text-melon-green hover:underline"
        >
          {t("sendBallot", { count: slotsLeft })}
        </button>
      )}

      {slotsLeft > 0 && showSendForm && !sent && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">{t("friendPhone")}</p>
          <div className="flex gap-2">
            <CountryCodeSelect value={dialCode} onChange={handleDialCode} />
            <div className="flex-1">
              <Input
                id="invite-phone"
                label={t("phoneLabel")}
                type="tel"
                placeholder="12345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleSendBallot}
            loading={loading}
            disabled={!phone}
            className="w-full"
          >
            {t("send")}
          </Button>
          {error && (
            <p className="text-center text-sm text-melon-red">{error}</p>
          )}
        </div>
      )}

      {sent && (
        <div className="text-center space-y-2">
          <p className="text-sm text-melon-green font-medium">{t("sent")}</p>
          {slotsLeft > 1 && (
            <button
              onClick={resetForm}
              className="text-sm text-melon-green hover:underline"
            >
              {t("sendAnother", { count: slotsLeft - 1 })}
            </button>
          )}
        </div>
      )}

      {slotsLeft <= 0 && !sent && (
        <p className="text-center text-xs text-gray-400">{t("allUsed")}</p>
      )}
    </div>
  );
}
