"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { STORKREDSE } from "@/lib/storkredse";

interface CandidateWithStatus {
  id: number;
  name: string;
  party: string;
  constituency: string;
  hasEmail: boolean;
  hasPhone: boolean;
  verified: boolean;
  optedOut: boolean;
  voteValue: boolean | null;
}

interface InviteCandidateButtonProps {
  inline?: boolean;
}

export default function InviteCandidateButton({
  inline = false,
}: InviteCandidateButtonProps) {
  const [open, setOpen] = useState(inline);
  const [candidates, setCandidates] = useState<CandidateWithStatus[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storkreds, setStorkreds] = useState("");
  const [party, setParty] = useState("");
  const [copiedGeneric, setCopiedGeneric] = useState(false);

  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    id: number;
    ok: boolean;
    msg: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const t = useTranslations("inviteCandidate");
  const cl = useTranslations("candidateList");
  const sh = useTranslations("share");
  const st = useTranslations("storkredse");
  const ct = useTranslations("constituency");
  const cs = useTranslations("candidateSelect");

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://stem-palaestina.vercel.app";

  useEffect(() => {
    if (!open) return;
    fetch("/api/votes/candidates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCandidates(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [open]);

  // Auto-detect constituency
  useEffect(() => {
    if (!open || storkreds) return;
    fetch("/api/geo/country")
      .then((res) => res.json())
      .then((data) => {
        if (data.storkreds) setStorkreds(data.storkreds);
      })
      .catch(() => {});
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset party when storkreds changes
  useEffect(() => {
    setParty("");
  }, [storkreds]);

  function getBadge(c: CandidateWithStatus) {
    if (c.optedOut) {
      return (
        <span className="shrink-0 inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
          {cl("optedOut")}
        </span>
      );
    }
    if (c.voteValue === true) {
      return (
        <span className="shrink-0 inline-flex items-center gap-1">
          <span className="inline-flex items-center rounded-full bg-melon-green/10 px-1.5 py-0.5 text-[10px] font-medium text-melon-green">
            {cl("votedYes")}
          </span>
          {!c.verified && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              {cl("unverified")}
            </span>
          )}
        </span>
      );
    }
    if (c.voteValue === false) {
      return (
        <span className="shrink-0 inline-flex items-center gap-1">
          <span className="inline-flex items-center rounded-full bg-melon-red/10 px-1.5 py-0.5 text-[10px] font-medium text-melon-red">
            {cl("votedNo")}
          </span>
          {!c.verified && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              {cl("unverified")}
            </span>
          )}
        </span>
      );
    }
    return (
      <span className="shrink-0 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
        {cl("unclaimed")}
      </span>
    );
  }

  function handleCopyLink(candidateId: number) {
    navigator.clipboard.writeText(`${baseUrl}/?panel=candidate`).then(() => {
      setCopiedId(candidateId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function handleCopyGenericLink() {
    navigator.clipboard.writeText(`${baseUrl}/?panel=candidate`).then(() => {
      setCopiedGeneric(true);
      setTimeout(() => setCopiedGeneric(false), 2000);
    });
  }

  async function handleSendEmailInvite(candidateId: number) {
    setInviteSending(true);
    setInviteResult(null);
    const deviceId = typeof window !== "undefined" ? localStorage.getItem("stem_device_id") || undefined : undefined;
    try {
      const res = await fetch("/api/invite/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "email", candidateId, deviceId }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteResult({ id: candidateId, ok: true, msg: t("sent") });
        setTimeout(() => setInviteResult(null), 2500);
      } else {
        setInviteResult({ id: candidateId, ok: false, msg: t(data.error || "sendError") });
      }
    } catch {
      setInviteResult({ id: candidateId, ok: false, msg: t("sendError") });
    } finally {
      setInviteSending(false);
    }
  }

  async function handleSendSmsInvite(candidateId: number) {
    setInviteSending(true);
    setInviteResult(null);
    const deviceId = typeof window !== "undefined" ? localStorage.getItem("stem_device_id") || undefined : undefined;
    try {
      const res = await fetch("/api/invite/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "sms", candidateId, deviceId }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteResult({ id: candidateId, ok: true, msg: t("sent") });
        setTimeout(() => setInviteResult(null), 2500);
      } else {
        setInviteResult({ id: candidateId, ok: false, msg: t(data.error || "sendError") });
      }
    } catch {
      setInviteResult({ id: candidateId, ok: false, msg: t("sendError") });
    } finally {
      setInviteSending(false);
    }
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

  function renderContent() {
    return (
      <div className="space-y-2.5">
        {!inline && (
          <button
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-between text-sm font-bold text-gray-700"
          >
            {cl("title")}
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}

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

        {!loaded && storkreds && (
          <div className="py-3 text-center">
            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-melon-green border-t-transparent" />
          </div>
        )}

        {/* Step 2: Parti */}
        {loaded && storkreds && parties.length > 0 && (
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
            value={party}
            onChange={(e) => setParty(e.target.value)}
          >
            <option value="">{cs("selectParty")}</option>
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

        {/* Step 3: Candidate list with invite actions */}
        {party && partyFiltered.length > 0 && (
          <div className="space-y-1.5">
            {partyFiltered.map((c) => {
              const result = inviteResult?.id === c.id ? inviteResult : null;
              const canInvite = !c.optedOut && (c.hasEmail || c.hasPhone);

              return (
                <div key={c.id} className="rounded-lg bg-gray-50 px-3 py-2 space-y-1.5">
                  {/* Name + badge */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate" title={c.name}>{c.name}</p>
                    {getBadge(c)}
                  </div>

                  {/* Share buttons */}
                  {!c.optedOut && (
                    <div className="flex gap-1.5 flex-wrap">
                      {c.hasEmail && (
                        <button
                          onClick={() => handleSendEmailInvite(c.id)}
                          disabled={inviteSending}
                          className="inline-flex items-center rounded-full border bg-white border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-melon-green/10 hover:border-melon-green hover:text-melon-green transition-colors disabled:opacity-50"
                        >
                          {inviteSending ? "..." : sh("email")}
                        </button>
                      )}
                      {c.hasPhone && (
                        <button
                          onClick={() => handleSendSmsInvite(c.id)}
                          disabled={inviteSending}
                          className="inline-flex items-center rounded-full border bg-white border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-melon-green/10 hover:border-melon-green hover:text-melon-green transition-colors disabled:opacity-50"
                        >
                          {inviteSending ? "..." : sh("sms")}
                        </button>
                      )}
                      <a
                        href={`fb-messenger://share?link=${encodeURIComponent(`${baseUrl}/?panel=candidate`)}`}
                        className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {sh("messenger")}
                      </a>
                      <button
                        onClick={() => handleCopyLink(c.id)}
                        className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {copiedId === c.id ? sh("copied") : sh("copyLink")}
                      </button>
                      {!canInvite && !c.hasEmail && !c.hasPhone && (
                        <span className="text-[10px] text-gray-400 self-center">{cl("noContact")}</span>
                      )}
                    </div>
                  )}

                  {result && (
                    <p className={`text-xs font-medium ${result.ok ? "text-melon-green" : "text-melon-red"}`}>
                      {result.msg}
                    </p>
                  )}
                </div>
              );
            })}

            {/* "Min kandidat er ikke på listen" — generic share */}
            <div className="rounded-lg border border-dashed border-gray-300 px-3 py-2.5">
              <p className="text-sm font-medium text-gray-600 mb-2">{cl("missingCandidate")}</p>
              <div className="flex gap-1.5 flex-wrap">
                <a
                  href={`fb-messenger://share?link=${encodeURIComponent(`${baseUrl}/?panel=candidate`)}`}
                  className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {sh("messenger")}
                </a>
                <button
                  onClick={handleCopyGenericLink}
                  className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {copiedGeneric ? sh("copied") : sh("copyLink")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (inline) {
    return renderContent();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-gray-50"
      >
        {cl("title")}
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  return renderContent();
}
