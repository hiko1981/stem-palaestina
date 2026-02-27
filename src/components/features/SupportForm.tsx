"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";

const CATEGORIES = [
  "bug",
  "suggestion",
  "candidate",
  "translation",
  "other",
] as const;

export default function SupportForm() {
  const t = useTranslations("support");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!category || !message.trim()) return;
    setError("");
    setLoading(true);
    try {
      const deviceId =
        typeof window !== "undefined"
          ? localStorage.getItem("stem_device_id") || undefined
          : undefined;
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message: message.trim(), deviceId }),
      });
      if (!res.ok) {
        setError(t("error"));
        return;
      }
      setSent(true);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center py-4 space-y-2">
        <p className="text-sm font-medium text-melon-green">{t("success")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{t("subtitle")}</p>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {t("categoryLabel")}
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none bg-white"
        >
          <option value="">{t("categoryPlaceholder")}</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {t(`cat_${cat}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {t("messageLabel")}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("messagePlaceholder")}
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none resize-none"
        />
      </div>
      <Button
        onClick={handleSubmit}
        loading={loading}
        disabled={!category || !message.trim()}
        className="w-full"
      >
        {t("send")}
      </Button>
      {error && <p className="text-center text-sm text-melon-red">{error}</p>}
    </div>
  );
}
