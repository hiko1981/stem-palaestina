"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { STORKREDSE } from "@/lib/storkredse";
import { useTranslations } from "next-intl";

interface CandidatePublicFormProps {
  token: string;
}

export default function CandidatePublicForm({ token }: CandidatePublicFormProps) {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState("");
  const [party, setParty] = useState("");
  const [constituency, setConstituency] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const t = useTranslations("candidateForm");

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/candidate/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, party, constituency, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSubmitted(true);
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-melon-green/30 bg-melon-green-light p-4 text-center space-y-2">
        <p className="text-sm font-medium text-melon-green">
          {t("submittedTitle")}
        </p>
        <p className="text-xs text-gray-600">{t("submittedText")}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="border-t border-gray-200 pt-6 space-y-3">
        <p className="text-center text-sm text-gray-600">{t("intro")}</p>
        <Button variant="outline" onClick={() => setOpen(true)} className="w-full">
          {t("showPublic")}
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 pt-6 space-y-4">
      <p className="text-sm text-gray-600">{t("formIntro")}</p>
      <Input
        id="candidate-name"
        label={t("nameLabel")}
        placeholder={t("namePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        id="candidate-party"
        label={t("partyLabel")}
        placeholder={t("partyPlaceholder")}
        value={party}
        onChange={(e) => setParty(e.target.value)}
      />
      <div>
        <label htmlFor="candidate-constituency" className="mb-1 block text-sm font-medium text-gray-700">
          {t("constituencyLabel")}
        </label>
        <select
          id="candidate-constituency"
          value={constituency}
          onChange={(e) => setConstituency(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-melon-green"
        >
          <option value="">{t("constituencyPlaceholder")}</option>
          {STORKREDSE.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <Button
        onClick={handleSubmit}
        loading={loading}
        disabled={!name || !party || !constituency}
        className="w-full"
      >
        {t("submit")}
      </Button>
      {error && (
        <p className="text-center text-sm text-melon-red">{error}</p>
      )}
      <button
        onClick={() => setOpen(false)}
        className="block w-full text-center text-xs text-gray-400 hover:text-gray-600"
      >
        {t("skip")}
      </button>
    </div>
  );
}
