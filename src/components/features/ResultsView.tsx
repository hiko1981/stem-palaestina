"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { STORKREDSE } from "@/lib/storkredse";

interface CandidateVote {
  id: number;
  name: string;
  party: string;
  constituency: string;
  photoUrl: string | null;
  hasEmail: boolean;
  hasPhone: boolean;
  verified: boolean;
  optedOut: boolean;
  voteValue: boolean | null;
}

function PercentBar({
  ja,
  nej,
  t,
}: {
  ja: number;
  nej: number;
  t: ReturnType<typeof useTranslations>;
}) {
  const total = ja + nej;
  if (total === 0) return null;
  const pct = Math.round((ja / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold mb-1">
        <span className="text-melon-green">
          {pct}% {t("yes")}
        </span>
        <span className="text-melon-red">
          {100 - pct}% {t("no")}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden flex">
        <div
          className="bg-melon-green transition-all"
          style={{ width: `${pct}%` }}
        />
        <div
          className="bg-melon-red transition-all"
          style={{ width: `${100 - pct}%` }}
        />
      </div>
    </div>
  );
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
        className={`h-12 w-12 shrink-0 rounded-full object-cover ring-2 ${ringColor}`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${bg}`}
    >
      {initials}
    </div>
  );
}

export default function ResultsView() {
  const [candidates, setCandidates] = useState<CandidateVote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storkreds, setStorkreds] = useState("");
  const [party, setParty] = useState("");

  // Invite state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    id: number;
    ok: boolean;
    msg: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const t = useTranslations("results");
  const st = useTranslations("storkredse");
  const cs = useTranslations("candidateSelect");
  const cl = useTranslations("candidateList");
  const sh = useTranslations("share");
  const inv = useTranslations("inviteCandidate");

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://vote-palestine.com";

  useEffect(() => {
    fetch("/api/votes/candidates")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCandidates(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  // --- Candidate filtering ---
  const storkredsName = STORKREDSE.find((s) => s.id === storkreds)?.name;
  const kredsFiltered = storkreds
    ? candidates.filter((c) => c.constituency === storkredsName)
    : candidates;
  const verifiedOnly = kredsFiltered.filter((c) => c.verified && !c.optedOut);
  const parties = [...new Set(verifiedOnly.map((c) => c.party))].sort();
  const filtered = party
    ? verifiedOnly.filter((c) => c.party === party)
    : verifiedOnly;

  const jaList = filtered.filter((c) => c.voteValue === true);
  const nejList = filtered.filter((c) => c.voteValue === false);
  const unvoted = filtered.filter((c) => c.voteValue === null);

  // --- Invite handlers ---
  function toggleExpand(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setInviteResult(null);
    }
  }

  async function handleSendInvite(candidateId: number, method: "email" | "sms") {
    setInviteSending(true);
    setInviteResult(null);
    const deviceId = typeof window !== "undefined" ? localStorage.getItem("stem_device_id") || undefined : undefined;
    try {
      const res = await fetch("/api/invite/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, candidateId, deviceId }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteResult({ id: candidateId, ok: true, msg: inv("sent") });
        setTimeout(() => setInviteResult(null), 2500);
      } else {
        setInviteResult({ id: candidateId, ok: false, msg: inv(data.error || "sendError") });
      }
    } catch {
      setInviteResult({ id: candidateId, ok: false, msg: inv("sendError") });
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

  function renderInviteActions(c: CandidateVote) {
    if (expandedId !== c.id) return null;
    const result = inviteResult?.id === c.id ? inviteResult : null;
    const canInvite = c.hasEmail || c.hasPhone;

    return (
      <div className="mt-1.5 space-y-1.5">
        {canInvite ? (
          <div className="flex gap-1 flex-wrap">
            {c.hasEmail && (
              <button
                onClick={(e) => { e.stopPropagation(); handleSendInvite(c.id, "email"); }}
                disabled={inviteSending}
                className="inline-flex items-center rounded-full border bg-white border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600 transition-colors hover:bg-melon-green/10 hover:border-melon-green hover:text-melon-green disabled:opacity-50"
              >
                {inviteSending ? "..." : sh("email")}
              </button>
            )}
            {c.hasPhone && (
              <button
                onClick={(e) => { e.stopPropagation(); handleSendInvite(c.id, "sms"); }}
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

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {t("candidateVotesTitle")}
      </h3>

      {/* Filters */}
      <div className="space-y-2">
        <select
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
          value={storkreds}
          onChange={(e) => {
            setStorkreds(e.target.value);
            setParty("");
          }}
        >
          <option value="">{t("allDenmark")}</option>
          {STORKREDSE.map((sk) => (
            <option key={sk.id} value={sk.id}>
              {st(sk.id)}
            </option>
          ))}
        </select>

        {parties.length > 1 && (
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
            value={party}
            onChange={(e) => setParty(e.target.value)}
          >
            <option value="">{cs("selectParty")}</option>
            {parties.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Candidate percent bar */}
      {(jaList.length > 0 || nejList.length > 0) ? (
        <PercentBar ja={jaList.length} nej={nejList.length} t={t} />
      ) : (
        <p className="text-sm text-gray-400">{t("noCandidatesYet")}</p>
      )}

      {/* Candidate list — two columns: Ja / Nej */}
      {(jaList.length > 0 || nejList.length > 0) && (
        <div className="grid grid-cols-2 gap-2">
          {/* Ja column */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-2 w-2 rounded-full bg-melon-green" />
              <span className="text-xs font-semibold text-melon-green">
                {t("yes")} ({jaList.length})
              </span>
            </div>
            <div className="space-y-1">
              {jaList.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                  <CandidateAvatar name={c.name} photoUrl={c.photoUrl} color="green" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate leading-tight" title={c.name}>{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.party}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nej column */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-2 w-2 rounded-full bg-melon-red" />
              <span className="text-xs font-semibold text-melon-red">
                {t("no")} ({nejList.length})
              </span>
            </div>
            <div className="space-y-1">
              {nejList.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                  <CandidateAvatar name={c.name} photoUrl={c.photoUrl} color="red" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate leading-tight" title={c.name}>{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.party}</p>
                  </div>
                </div>
              ))}
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
              {t("notVoted")} ({unvoted.length})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {unvoted.map((c) => (
              <div
                key={c.id}
                onClick={() => toggleExpand(c.id)}
                className={`rounded-lg px-2 py-1.5 cursor-pointer hover:bg-gray-100 ${expandedId === c.id ? "bg-gray-50 ring-1 ring-gray-200" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <CandidateAvatar name={c.name} photoUrl={c.photoUrl} color="gray" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate leading-tight" title={c.name}>{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.party}</p>
                  </div>
                </div>
                {renderInviteActions(c)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
