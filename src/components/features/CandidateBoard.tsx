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
  photoUrl: string | null;
  verified: boolean;
  optedOut: boolean;
  voteValue: boolean | null;
}

function CandidateAvatar({ name, photoUrl, color }: { name: string; photoUrl?: string | null; color: "green" | "red" | "gray" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const ringColor =
    color === "green"
      ? "ring-melon-green/40"
      : color === "red"
        ? "ring-melon-red/40"
        : "ring-gray-200";
  const bg =
    color === "green"
      ? "bg-melon-green/15 text-melon-green"
      : color === "red"
        ? "bg-melon-red/15 text-melon-red"
        : "bg-gray-100 text-gray-400";

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`h-8 w-8 shrink-0 rounded-full object-cover ring-2 ${ringColor}`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${bg}`}
    >
      {initials}
    </div>
  );
}

function partyLetter(party: string): string {
  return party.match(/\(([^)]+)\)/)?.[1] ?? party;
}

interface CandidateBoardProps {
  storkreds?: string;
  onStorkredsChange?: (id: string) => void;
}

export default function CandidateBoard({ storkreds: controlledStorkreds, onStorkredsChange }: CandidateBoardProps) {
  const [candidates, setCandidates] = useState<CandidateWithStatus[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [internalStorkreds, setInternalStorkreds] = useState("");
  const [partyFilter, setPartyFilter] = useState("");

  const storkreds = controlledStorkreds ?? internalStorkreds;
  function setStorkreds(val: string) {
    if (onStorkredsChange) onStorkredsChange(val);
    else setInternalStorkreds(val);
  }

  // Invite state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    id: number;
    ok: boolean;
    msg: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedGeneric, setCopiedGeneric] = useState(false);

  const t = useTranslations("inviteCandidate");
  const cl = useTranslations("candidateList");
  const sh = useTranslations("share");
  const st = useTranslations("storkredse");
  const ct = useTranslations("constituency");
  const r = useTranslations("results");

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://vote-palestine.com";

  useEffect(() => {
    fetch("/api/votes/candidates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCandidates(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function toggleExpand(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setInviteResult(null);
    }
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

  if (!loaded) {
    return (
      <div className="py-6 text-center">
        <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-melon-green border-t-transparent" />
      </div>
    );
  }

  // Unique parties sorted by party letter
  const parties = Array.from(new Set(candidates.map((c) => c.party))).sort((a, b) => {
    const la = partyLetter(a);
    const lb = partyLetter(b);
    return la.localeCompare(lb, "da");
  });

  // Filter by storkreds and party
  const storkredsName = STORKREDSE.find((s) => s.id === storkreds)?.name;
  const filtered = candidates.filter((c) => {
    if (storkreds && c.constituency !== storkredsName) return false;
    if (partyFilter && c.party !== partyFilter) return false;
    return true;
  });

  const jaList = filtered.filter((c) => c.voteValue === true);
  const nejList = filtered.filter((c) => c.voteValue === false);
  const unvoted = filtered.filter((c) => c.voteValue === null);

  function renderInviteActions(c: CandidateWithStatus) {
    const isExpanded = expandedId === c.id;
    const result = inviteResult?.id === c.id ? inviteResult : null;

    if (!isExpanded) return null;

    const canInvite = c.hasEmail || c.hasPhone;

    return (
      <div className="mt-1.5 space-y-1.5">
        {canInvite ? (
          <div className="flex gap-1 flex-wrap">
            {c.hasEmail && (
              <button
                onClick={(e) => { e.stopPropagation(); handleSendEmailInvite(c.id); }}
                disabled={inviteSending}
                className="inline-flex items-center rounded-full border bg-white border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600 transition-colors hover:bg-melon-green/10 hover:border-melon-green hover:text-melon-green disabled:opacity-50"
              >
                {inviteSending ? "..." : sh("email")}
              </button>
            )}
            {c.hasPhone && (
              <button
                onClick={(e) => { e.stopPropagation(); handleSendSmsInvite(c.id); }}
                disabled={inviteSending}
                className="inline-flex items-center rounded-full border bg-white border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600 transition-colors hover:bg-melon-green/10 hover:border-melon-green hover:text-melon-green disabled:opacity-50"
              >
                {inviteSending ? "..." : sh("sms")}
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleCopyLink(c.id); }}
              className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600"
            >
              {copiedId === c.id ? sh("copied") : sh("copyLink")}
            </button>
          </div>
        ) : (
          <p className="text-[10px] text-gray-400">{cl("noContact")}</p>
        )}

        {result && (
          <p className={`text-[11px] font-medium ${result.ok ? "text-melon-green" : "text-melon-red"}`}>
            {result.msg}
          </p>
        )}
      </div>
    );
  }

  function renderCard(c: CandidateWithStatus) {
    const isUnvoted = c.voteValue === null;
    const color =
      c.voteValue === true ? "green" : c.voteValue === false ? "red" : "gray";

    return (
      <div
        key={c.id}
        onClick={isUnvoted && !c.optedOut ? () => toggleExpand(c.id) : undefined}
        className={`rounded-lg px-2 py-1.5 ${
          isUnvoted && !c.optedOut ? "cursor-pointer hover:bg-gray-100" : ""
        } ${expandedId === c.id ? "bg-gray-50 ring-1 ring-gray-200" : ""}`}
      >
        <div className="flex items-center gap-2">
          <CandidateAvatar name={c.name} photoUrl={c.photoUrl} color={color} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate leading-tight" title={c.name}>{c.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{partyLetter(c.party)}</p>
          </div>
          {c.optedOut && (
            <span className="shrink-0 inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
              {cl("optedOut")}
            </span>
          )}
          {!c.optedOut && !c.verified && c.voteValue !== null && (
            <span className="shrink-0 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              {cl("unverified")}
            </span>
          )}
        </div>
        {isUnvoted && !c.optedOut && renderInviteActions(c)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2">
        <select
          className="w-1/3 min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
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
        <select
          className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
          value={partyFilter}
          onChange={(e) => setPartyFilter(e.target.value)}
        >
          <option value="">{cl("allParties")}</option>
          {parties.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Two columns: Ja / Nej */}
      {(jaList.length > 0 || nejList.length > 0) && (
        <div className="grid grid-cols-2 gap-2">
          {/* Ja column */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-2 w-2 rounded-full bg-melon-green" />
              <span className="text-xs font-semibold text-melon-green">
                {r("yes")} ({jaList.length})
              </span>
            </div>
            <div className="space-y-1">
              {jaList.map((c) => renderCard(c))}
            </div>
          </div>

          {/* Nej column */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-2 w-2 rounded-full bg-melon-red" />
              <span className="text-xs font-semibold text-melon-red">
                {r("no")} ({nejList.length})
              </span>
            </div>
            <div className="space-y-1">
              {nejList.map((c) => renderCard(c))}
            </div>
          </div>
        </div>
      )}

      {/* Unvoted candidates */}
      {unvoted.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-2 w-2 rounded-full bg-gray-300" />
            <span className="text-xs font-semibold text-gray-500">
              {cl("unclaimed")} ({unvoted.length})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {unvoted.map((c) => renderCard(c))}
          </div>
        </div>
      )}

      {/* "Min kandidat mangler" */}
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
  );
}
