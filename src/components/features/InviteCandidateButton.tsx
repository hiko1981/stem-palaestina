"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useTranslations } from "next-intl";

export default function InviteCandidateButton() {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"sms" | "email" | null>(null);
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);
  const t = useTranslations("inviteCandidate");

  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : "https://stem-palaestina.vercel.app";

  const message = `${t("message")} ${baseUrl}/stem`;

  function handleSendSms() {
    const smsUrl = `sms:${value}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, "_blank");
    setSent(true);
  }

  function handleSendEmail() {
    const subject = t("emailSubject");
    const mailUrl = `mailto:${value}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(mailUrl, "_blank");
    setSent(true);
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="w-full">
        {t("button")}
      </Button>
    );
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 text-center space-y-2">
        <p className="text-sm text-melon-green font-medium">{t("ready")}</p>
        <button
          onClick={() => { setSent(false); setMethod(null); setValue(""); }}
          className="text-sm text-melon-green hover:underline"
        >
          {t("another")}
        </button>
      </div>
    );
  }

  if (!method) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700 text-center">{t("how")}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setMethod("sms")} className="flex-1">
            {t("sms")}
          </Button>
          <Button variant="outline" onClick={() => setMethod("email")} className="flex-1">
            {t("email")}
          </Button>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="block w-full text-center text-xs text-gray-400 hover:text-gray-600"
        >
          {t("cancel")}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-3">
      <Input
        id="invite-candidate"
        label={method === "sms" ? t("phoneLabel") : t("emailLabel")}
        type={method === "sms" ? "tel" : "email"}
        placeholder={method === "sms" ? "+45 12345678" : "kandidat@example.com"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        onClick={method === "sms" ? handleSendSms : handleSendEmail}
        disabled={!value}
        className="w-full"
      >
        {t("send")}
      </Button>
      <button
        onClick={() => { setMethod(null); setValue(""); }}
        className="block w-full text-center text-xs text-gray-400 hover:text-gray-600"
      >
        {t("back")}
      </button>
    </div>
  );
}
