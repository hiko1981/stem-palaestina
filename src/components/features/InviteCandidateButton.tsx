"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { STORKREDSE } from "@/lib/storkredse";
import ConstituencyPicker from "@/components/features/ConstituencyPicker";

interface CandidateWithStatus {
  id: number;
  name: string;
  party: string;
  constituency: string;
  contactEmail: string | null;
  verified: boolean;
  voteValue: boolean | null;
}

interface InviteCandidateButtonProps {
  inline?: boolean;
}

type InviteMode = null | "email" | "sms";

export default function InviteCandidateButton({
  inline = false,
}: InviteCandidateButtonProps) {
  const [open, setOpen] = useState(inline);
  const [candidates, setCandidates] = useState<CandidateWithStatus[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storkreds, setStorkreds] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Inline invite state per candidate
  const [inviteTarget, setInviteTarget] = useState<number | null>(null);
  const [inviteMode, setInviteMode] = useState<InviteMode>(null);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    id: number;
    ok: boolean;
    msg: string;
  } | null>(null);

  const t = useTranslations("inviteCandidate");
  const cl = useTranslations("candidateList");
  const sh = useTranslations("share");

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

  function getBadge(c: CandidateWithStatus) {
    if (!c.verified && c.voteValue === null) {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          {cl("unclaimed")}
        </span>
      );
    }
    if (c.voteValue === true) {
      return (
        <span className="inline-flex items-center rounded-full bg-melon-green/10 px-2 py-0.5 text-xs font-medium text-melon-green">
          {t("yes") || "Ja"} ✓
        </span>
      );
    }
    if (c.voteValue === false) {
      return (
        <span className="inline-flex items-center rounded-full bg-melon-red/10 px-2 py-0.5 text-xs font-medium text-melon-red">
          {t("no") || "Nej"} ✗
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        {cl("unclaimed")}
      </span>
    );
  }

  function handleCopyLink(candidateId: number) {
    navigator.clipboard.writeText(`${baseUrl}/stem`).then(() => {
      setCopiedId(candidateId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function openInvite(candidateId: number, mode: InviteMode) {
    setInviteTarget(candidateId);
    setInviteMode(mode);
    setInviteInput("");
    setInviteResult(null);
  }

  function closeInvite() {
    setInviteTarget(null);
    setInviteMode(null);
    setInviteInput("");
    setInviteSending(false);
  }

  async function handleSendInvite(candidateName: string) {
    if (!inviteMode || !inviteInput.trim() || !inviteTarget) return;
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
        setInviteResult({ id: inviteTarget, ok: true, msg: t("sent") });
        setInviteInput("");
        setTimeout(() => {
          closeInvite();
          setInviteResult(null);
        }, 2500);
      } else {
        setInviteResult({
          id: inviteTarget,
          ok: false,
          msg: data.error || t("sendError"),
        });
      }
    } catch {
      setInviteResult({
        id: inviteTarget!,
        ok: false,
        msg: t("sendError"),
      });
    } finally {
      setInviteSending(false);
    }
  }

  // Filter by storkreds
  const storkredsName = STORKREDSE.find((s) => s.id === storkreds)?.name;
  const filtered = storkreds
    ? candidates.filter((c) => c.constituency === storkredsName)
    : candidates;

  function renderContent() {
    return (
      <div className="space-y-3">
        {!inline && (
          <button
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-between text-sm font-bold text-gray-700"
          >
            {cl("title")}
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
        )}

        <ConstituencyPicker value={storkreds} onChange={setStorkreds} />

        {!loaded && (
          <div className="py-4 text-center">
            <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-melon-green border-t-transparent" />
          </div>
        )}

        {loaded && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((c) => {
              const partyLetter =
                c.party.match(/\(([^)]+)\)/)?.[1] ?? c.party;
              const region = c.constituency.replace(" Storkreds", "");
              const isInviting = inviteTarget === c.id && inviteMode;
              const result =
                inviteResult?.id === c.id ? inviteResult : null;

              return (
                <div
                  key={c.id}
                  className="rounded-lg bg-gray-50 px-3 py-2.5 space-y-1.5"
                >
                  {/* Candidate info row */}
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {c.name} ({partyLetter})
                        <span className="text-gray-400 font-normal">
                          {" "}
                          · {region}
                        </span>
                      </p>
                      {c.contactEmail && (
                        <p className="text-xs text-gray-400">
                          {c.contactEmail}
                        </p>
                      )}
                    </div>
                    {getBadge(c)}
                  </div>

                  {/* Share buttons row */}
                  <div className="flex gap-1.5 flex-wrap">
                    {c.contactEmail && (
                      <button
                        onClick={() => openInvite(c.id, "email")}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                          isInviting && inviteMode === "email"
                            ? "bg-melon-green/10 border-melon-green text-melon-green"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {sh("email")}
                      </button>
                    )}
                    <button
                      onClick={() => openInvite(c.id, "sms")}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                        isInviting && inviteMode === "sms"
                          ? "bg-melon-green/10 border-melon-green text-melon-green"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {sh("sms")}
                    </button>
                    <a
                      href={`fb-messenger://share?link=${encodeURIComponent(`${baseUrl}/stem`)}`}
                      className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {sh("messenger")}
                    </a>
                    <button
                      onClick={() => handleCopyLink(c.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {copiedId === c.id ? sh("copied") : sh("copyLink")}
                    </button>
                  </div>

                  {/* Inline invite input */}
                  {isInviting && (
                    <div className="flex gap-2 items-center pt-1">
                      <input
                        type={inviteMode === "email" ? "email" : "tel"}
                        placeholder={
                          inviteMode === "email"
                            ? c.contactEmail || t("emailLabel")
                            : t("phoneLabel")
                        }
                        value={inviteInput}
                        onChange={(e) => setInviteInput(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-melon-green focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSendInvite(c.name)}
                        disabled={!inviteInput.trim() || inviteSending}
                        className="rounded-lg bg-melon-green px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition-colors"
                      >
                        {inviteSending ? "..." : t("send")}
                      </button>
                      <button
                        onClick={closeInvite}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Result feedback */}
                  {result && (
                    <p
                      className={`text-xs font-medium ${
                        result.ok ? "text-melon-green" : "text-melon-red"
                      }`}
                    >
                      {result.msg}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {loaded && filtered.length === 0 && storkreds && (
          <p className="text-center text-sm text-gray-500 py-2">
            {cl("inviteTitle")}
          </p>
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
        className="flex w-full items-center justify-between rounded-xl border-2 border-gray-200 px-4 py-3 text-left font-semibold transition-colors hover:bg-gray-50"
      >
        {cl("title")}
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    );
  }

  return renderContent();
}
