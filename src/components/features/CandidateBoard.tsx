"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { STORKREDSE } from "@/lib/storkredse";

interface CandidateWithStatus {
  id: number;
  name: string;
  party: string;
  constituency: string;
  contactEmail: string | null;
  verified: boolean;
  voteValue: boolean | null;
}

type InviteMode = null | "email" | "sms";

function Initials({ name, color }: { name: string; color: "green" | "red" | "gray" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const bg =
    color === "green"
      ? "bg-melon-green/15 text-melon-green"
      : color === "red"
        ? "bg-melon-red/15 text-melon-red"
        : "bg-gray-100 text-gray-400";
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

export default function CandidateBoard() {
  const [candidates, setCandidates] = useState<CandidateWithStatus[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storkreds, setStorkreds] = useState("");

  // Invite state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [inviteMode, setInviteMode] = useState<InviteMode>(null);
  const [inviteInput, setInviteInput] = useState("");
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
      : "https://stem-palaestina.vercel.app";

  useEffect(() => {
    fetch("/api/votes/candidates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCandidates(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
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

  function toggleExpand(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
      setInviteMode(null);
    } else {
      setExpandedId(id);
      setInviteMode(null);
      setInviteInput("");
      setInviteResult(null);
    }
  }

  function openInvite(id: number, mode: InviteMode) {
    setExpandedId(id);
    setInviteMode(mode);
    setInviteInput("");
    setInviteResult(null);
  }

  function closeInvite() {
    setInviteMode(null);
    setInviteInput("");
    setInviteSending(false);
  }

  async function handleSendInvite(candidateName: string) {
    if (!inviteMode || !inviteInput.trim() || !expandedId) return;
    setInviteSending(true);
    setInviteResult(null);
    try {
      const res = await fetch("/api/invite/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: inviteMode,
          to: inviteInput.trim(),
          candidateName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteResult({ id: expandedId, ok: true, msg: t("sent") });
        setInviteInput("");
        setTimeout(() => {
          closeInvite();
          setInviteResult(null);
        }, 2500);
      } else {
        setInviteResult({
          id: expandedId,
          ok: false,
          msg: data.error || t("sendError"),
        });
      }
    } catch {
      setInviteResult({
        id: expandedId!,
        ok: false,
        msg: t("sendError"),
      });
    } finally {
      setInviteSending(false);
    }
  }

  function handleCopyLink(candidateId: number) {
    navigator.clipboard.writeText(`${baseUrl}/stem`).then(() => {
      setCopiedId(candidateId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function handleCopyGenericLink() {
    navigator.clipboard.writeText(`${baseUrl}/stem`).then(() => {
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

  // Filter by storkreds
  const storkredsName = STORKREDSE.find((s) => s.id === storkreds)?.name;
  const filtered = storkreds
    ? candidates.filter((c) => c.constituency === storkredsName)
    : candidates;

  const jaList = filtered.filter((c) => c.voteValue === true);
  const nejList = filtered.filter((c) => c.voteValue === false);
  const unvoted = filtered.filter((c) => c.voteValue === null);

  function renderInviteActions(c: CandidateWithStatus) {
    const isExpanded = expandedId === c.id;
    const result = inviteResult?.id === c.id ? inviteResult : null;

    if (!isExpanded) return null;

    return (
      <div className="mt-1.5 space-y-1.5">
        {/* Contact buttons */}
        <div className="flex gap-1 flex-wrap">
          {c.contactEmail && (
            <button
              onClick={(e) => { e.stopPropagation(); openInvite(c.id, "email"); }}
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                inviteMode === "email"
                  ? "bg-melon-green/10 border-melon-green text-melon-green"
                  : "bg-white border-gray-200 text-gray-600"
              }`}
            >
              {sh("email")}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); openInvite(c.id, "sms"); }}
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
              inviteMode === "sms"
                ? "bg-melon-green/10 border-melon-green text-melon-green"
                : "bg-white border-gray-200 text-gray-600"
            }`}
          >
            {sh("sms")}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleCopyLink(c.id); }}
            className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600"
          >
            {copiedId === c.id ? sh("copied") : sh("copyLink")}
          </button>
        </div>

        {/* Inline input */}
        {inviteMode && (
          <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
            <input
              type={inviteMode === "email" ? "email" : "tel"}
              placeholder={
                inviteMode === "email"
                  ? c.contactEmail || t("emailLabel")
                  : t("phoneLabel")
              }
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] focus:border-melon-green focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => handleSendInvite(c.name)}
              disabled={!inviteInput.trim() || inviteSending}
              className="rounded-lg bg-melon-green px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              {inviteSending ? "..." : t("send")}
            </button>
            <button onClick={closeInvite} className="text-[11px] text-gray-400">
              ✕
            </button>
          </div>
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
        onClick={isUnvoted ? () => toggleExpand(c.id) : undefined}
        className={`rounded-lg px-2 py-1.5 ${
          isUnvoted ? "cursor-pointer hover:bg-gray-100" : ""
        } ${expandedId === c.id ? "bg-gray-50 ring-1 ring-gray-200" : ""}`}
      >
        <div className="flex items-center gap-2">
          <Initials name={c.name} color={color} />
          <div className="min-w-0">
            <p className="text-xs font-medium truncate leading-tight">{c.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{partyLetter(c.party)}</p>
          </div>
        </div>
        {isUnvoted && renderInviteActions(c)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Storkreds filter */}
      <select
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-melon-green focus:outline-none"
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
            href={`fb-messenger://share?link=${encodeURIComponent(`${baseUrl}/stem`)}`}
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
