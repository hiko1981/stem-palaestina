"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { STORKREDSE } from "@/lib/storkredse";
import CountryCodeSelect from "@/components/features/CountryCodeSelect";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface UnclaimedCandidate {
  id: number;
  name: string;
  party: string;
  constituency: string;
}

interface CandidateSelectProps {
  onSelect: (value: string) => void;
  voteValue: boolean;
}

export default function CandidateSelect({
  onSelect,
  voteValue,
}: CandidateSelectProps) {
  const [candidates, setCandidates] = useState<UnclaimedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [storkreds, setStorkreds] = useState("");
  const [party, setParty] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [autoDetecting, setAutoDetecting] = useState(true);

  // Phone input state
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("+45");
  const [phoneError, setPhoneError] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const t = useTranslations("candidateSelect");
  const b = useTranslations("ballot");
  const st = useTranslations("storkredse");

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
        if (data.storkreds) {
          setStorkreds(data.storkreds);
        }
        setAutoDetecting(false);
      })
      .catch(() => setAutoDetecting(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset downstream selections when storkreds changes
  useEffect(() => {
    setParty("");
    setSelectedId("");
  }, [storkreds]);

  // Reset candidate when party changes
  useEffect(() => {
    setSelectedId("");
  }, [party]);

  // Auto-select candidate if only one match
  useEffect(() => {
    if (!storkreds || !party) return;
    const storkredsName = STORKREDSE.find((s) => s.id === storkreds)?.name;
    const matches = candidates.filter(
      (c) => c.constituency === storkredsName && c.party === party
    );
    if (matches.length === 1) {
      setSelectedId(String(matches[0].id));
      onSelect(String(matches[0].id));
    }
  }, [storkreds, party, candidates, onSelect]);

  if (loading) {
    return (
      <p className="text-center text-sm text-gray-500 py-2">{t("loading")}</p>
    );
  }

  // Get candidates for selected storkreds
  const storkredsName = STORKREDSE.find((s) => s.id === storkreds)?.name;
  const kredsFiltered = storkreds
    ? candidates.filter((c) => c.constituency === storkredsName)
    : [];

  // Unique parties in selected storkreds
  const parties = [...new Set(kredsFiltered.map((c) => c.party))].sort();

  // Candidates matching both storkreds + party
  const partyFiltered = party
    ? kredsFiltered.filter((c) => c.party === party)
    : [];

  const showNameDropdown = partyFiltered.length > 1;
  const candidateReady =
    selectedId && selectedId !== "" && selectedId !== "new";

  async function handleSendBallot() {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "stem_palaestina_candidate_id",
        selectedId === "new" ? "new" : selectedId
      );
      localStorage.setItem(
        "stem_palaestina_vote",
        voteValue ? "true" : "false"
      );
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

  if (smsSent) {
    return (
      <div className="text-center py-4 space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-melon-green/10 mb-1">
          <svg
            className="h-6 w-6 text-melon-green"
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
        <h3 className="text-lg font-bold">{b("sentTitle")}</h3>
        <p className="text-sm text-gray-600">{b("sentText")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sentence: "Jeg er kandidat i [Kreds] og kandidat for [Parti]" */}
      <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-gray-700">
        <span>{t("iAmCandidate")}</span>
        <select
          className="rounded-lg border-2 border-gray-200 bg-white px-2 py-1.5 text-sm font-semibold focus:border-melon-green focus:outline-none"
          value={storkreds}
          onChange={(e) => setStorkreds(e.target.value)}
        >
          <option value="" disabled>
            {t("selectConstituency")}
          </option>
          {STORKREDSE.map((sk) => (
            <option key={sk.id} value={sk.id}>
              {st(sk.id)}
            </option>
          ))}
        </select>
        <span>{t("andFor")}</span>
        <select
          className="rounded-lg border-2 border-gray-200 bg-white px-2 py-1.5 text-sm font-semibold focus:border-melon-green focus:outline-none disabled:opacity-40"
          value={party}
          onChange={(e) => setParty(e.target.value)}
          disabled={!storkreds || parties.length === 0}
        >
          <option value="" disabled>
            {t("selectParty")}
          </option>
          {parties.map((p) => {
            const letter = p.match(/\(([^)]+)\)/)?.[1] ?? p;
            return (
              <option key={p} value={p}>
                {p.replace(/ \([^)]+\)/, "")} ({letter})
              </option>
            );
          })}
        </select>
      </div>

      {/* Name dropdown when multiple matches */}
      {showNameDropdown && (
        <div>
          <select
            className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-melon-green focus:outline-none"
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              onSelect(e.target.value);
            }}
          >
            <option value="" disabled>
              {t("placeholder")}
            </option>
            {partyFiltered.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* "Not on the list" option */}
      {storkreds && party && (
        <button
          onClick={() => {
            setSelectedId("new");
            onSelect("new");
          }}
          className={`text-xs underline transition-colors ${
            selectedId === "new"
              ? "text-melon-green font-medium"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {t("missingOption")}
        </button>
      )}

      {/* Phone input — always visible when candidate is selected, choices stay above */}
      {(candidateReady || selectedId === "new") && (
        <div className="space-y-3 border-t border-gray-100 pt-3">
          <div className="flex gap-2">
            <CountryCodeSelect value={dialCode} onChange={handleDialCode} />
            <div className="flex-1">
              <Input
                id="candidate-phone"
                label={b("phoneLabel")}
                type="tel"
                placeholder="12345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleSendBallot}
            loading={phoneLoading}
            disabled={!phone}
            className="w-full"
          >
            {b("send")}
          </Button>
          {phoneError && (
            <p className="text-center text-sm text-melon-red">{phoneError}</p>
          )}
        </div>
      )}
    </div>
  );
}
