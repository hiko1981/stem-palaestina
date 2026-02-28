"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { STORKREDSE } from "@/lib/storkredse";
import CountryCodeSelect from "@/components/features/CountryCodeSelect";
import Button from "@/components/ui/Button";
import PhoneNote from "@/components/ui/PhoneNote";

interface UnclaimedCandidate {
  id: number;
  name: string;
  party: string;
  constituency: string;
}

interface CandidateSelectProps {
  onSelect: (value: string) => void;
}

export default function CandidateSelect({
  onSelect,
}: CandidateSelectProps) {
  const [candidates, setCandidates] = useState<UnclaimedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [storkreds, setStorkreds] = useState("");
  const [party, setParty] = useState("");
  const [selectedId, setSelectedId] = useState("");

  // Phone input state
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("+45");
  const [phoneError, setPhoneError] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const t = useTranslations("candidateSelect");
  const b = useTranslations("ballot");
  const st = useTranslations("storkredse");
  const ct = useTranslations("constituency");

  const handleDialCode = useCallback((code: string) => {
    setDialCode(code);
  }, []);

  useEffect(() => {
    fetch("/api/candidates/unclaimed")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCandidates(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Auto-detect constituency
  useEffect(() => {
    if (storkreds) return;
    fetch("/api/geo/country")
      .then((res) => res.json())
      .then((data) => {
        if (data.storkreds) setStorkreds(data.storkreds);
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset downstream when storkreds changes
  useEffect(() => {
    setParty("");
    setSelectedId("");
  }, [storkreds]);

  // Reset candidate when party changes
  useEffect(() => {
    setSelectedId("");
  }, [party]);

  function handleSelect(id: string) {
    setSelectedId(id);
    onSelect(id);
  }

  async function handleSendBallot() {
    if (typeof window !== "undefined") {
      localStorage.setItem("stem_palaestina_candidate_id", selectedId);
      localStorage.setItem("stem_palaestina_role", "candidate");
    }
    setPhoneError("");
    setPhoneLoading(true);
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
          role: "candidate",
          candidateId: selectedId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneError(data.error);
        return;
      }
      setSmsSent(true);
    } catch {
      setPhoneError(b("networkError"));
    } finally {
      setPhoneLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-3 text-center">
        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-melon-green border-t-transparent" />
      </div>
    );
  }

  if (smsSent) {
    return (
      <div className="text-center py-3 space-y-2">
        <p className="text-sm font-semibold text-melon-green">{b("sentTitle")}</p>
        <p className="text-xs text-gray-500">{b("sentText")}</p>
        <button
          onClick={() => {
            setSmsSent(false);
            setPhone("");
            setPhoneError("");
          }}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          {t("backToSelection")}
        </button>
      </div>
    );
  }

  // Progressive filtering
  const storkredsName = STORKREDSE.find((s) => s.id === storkreds)?.name;
  const kredsFiltered = storkreds
    ? candidates.filter((c) => c.constituency === storkredsName)
    : [];
  const parties = [...new Set(kredsFiltered.map((c) => c.party))].sort();
  const partyFiltered = party
    ? kredsFiltered.filter((c) => c.party === party)
    : [];

  const hasSelection = selectedId !== "";

  return (
    <div className="space-y-2.5">
      {/* Step 1: Kreds */}
      <select
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
        value={storkreds}
        onChange={(e) => setStorkreds(e.target.value)}
      >
        <option value="">{ct("placeholder")}</option>
        {STORKREDSE.map((sk) => (
          <option key={sk.id} value={sk.id}>
            {st(sk.id)}
          </option>
        ))}
      </select>

      {/* Step 2: Parti */}
      {storkreds && parties.length > 0 && (
        <select
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
          value={party}
          onChange={(e) => setParty(e.target.value)}
        >
          <option value="">{t("selectParty")}</option>
          {parties.map((p) => {
            const letter = p.match(/\(([^)]+)\)/)?.[1] ?? p;
            return (
              <option key={p} value={p}>
                {p.replace(/ \([^)]+\)/, "")} ({letter})
              </option>
            );
          })}
        </select>
      )}

      {/* Empty state: kreds selected but no candidates */}
      {storkreds && kredsFiltered.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-2">
          {t("noCandidates")}
        </p>
      )}

      {/* Step 3: Candidate list */}
      {party && partyFiltered.length > 0 && (
        <div className="space-y-1">
          {partyFiltered.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelect(String(c.id))}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                selectedId === String(c.id)
                  ? "bg-melon-green/10 text-melon-green font-medium"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {c.name}
            </button>
          ))}
          <button
            onClick={() => handleSelect("new")}
            className={`w-full text-left rounded-lg border border-dashed px-3 py-2 text-sm font-medium transition-colors ${
              selectedId === "new"
                ? "border-melon-green bg-melon-green/10 text-melon-green"
                : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            {t("missingOption")}
          </button>
        </div>
      )}

      {/* "Mangler" option always available when kreds is selected */}
      {storkreds && !party && (
        <button
          onClick={() => handleSelect("new")}
          className={`w-full text-left rounded-lg border border-dashed px-3 py-2 text-sm font-medium transition-colors ${
            selectedId === "new"
              ? "border-melon-green bg-melon-green/10 text-melon-green"
              : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          {t("missingOption")}
        </button>
      )}

      {/* Step 4: Phone input */}
      {hasSelection && (
        <div className="space-y-2 border-t border-gray-100 pt-2.5">
          <label className="block text-xs font-medium text-gray-500">
            {b("phoneLabel")}
          </label>
          <div className="flex gap-2 min-w-0">
            <CountryCodeSelect value={dialCode} onChange={handleDialCode} />
            <input
              type="tel"
              placeholder="12345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
            />
          </div>
          <Button
            onClick={handleSendBallot}
            loading={phoneLoading}
            disabled={!phone}
            className="w-full"
          >
            {b("send")}
          </Button>
          <PhoneNote />
          {phoneError && (
            <p className="text-center text-xs text-melon-red">{phoneError}</p>
          )}
        </div>
      )}
    </div>
  );
}
