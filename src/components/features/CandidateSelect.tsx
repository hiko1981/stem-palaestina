"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { STORKREDSE } from "@/lib/storkredse";
import ConstituencyPicker from "@/components/features/ConstituencyPicker";

interface UnclaimedCandidate {
  id: number;
  name: string;
  party: string;
  constituency: string;
}

interface CandidateSelectProps {
  onSelect: (value: string) => void;
}

export default function CandidateSelect({ onSelect }: CandidateSelectProps) {
  const [candidates, setCandidates] = useState<UnclaimedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [storkreds, setStorkreds] = useState("");
  const t = useTranslations("candidateSelect");

  useEffect(() => {
    fetch("/api/candidates/unclaimed")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCandidates(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-center text-sm text-gray-500 py-2">{t("loading")}</p>
    );
  }

  // Map storkreds id to full name for filtering
  const storkredsName = STORKREDSE.find((s) => s.id === storkreds)?.name;
  const filtered = storkreds
    ? candidates.filter((c) => c.constituency === storkredsName)
    : candidates;

  return (
    <div className="space-y-3">
      <ConstituencyPicker value={storkreds} onChange={setStorkreds} />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t("title")}
        </label>
        <select
          className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-melon-green focus:outline-none"
          defaultValue=""
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="" disabled>
            {t("placeholder")}
          </option>
          {filtered.map((c) => {
            const partyLetter = c.party.match(/\(([^)]+)\)/)?.[1] ?? c.party;
            return (
              <option key={c.id} value={String(c.id)}>
                {c.name} ({partyLetter}) &middot; {c.constituency.replace(" Storkreds", "")}
              </option>
            );
          })}
          <option value="new">{t("missingOption")}</option>
        </select>
      </div>
    </div>
  );
}
