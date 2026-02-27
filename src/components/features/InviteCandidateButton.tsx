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
  /** When true, render content directly without the open/close button wrapper */
  inline?: boolean;
}

export default function InviteCandidateButton({
  inline = false,
}: InviteCandidateButtonProps) {
  const [open, setOpen] = useState(inline);
  const [candidates, setCandidates] = useState<CandidateWithStatus[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storkreds, setStorkreds] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const t = useTranslations("inviteCandidate");
  const cl = useTranslations("candidateList");
  const sh = useTranslations("share");

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://stem-palaestina.vercel.app";

  const message = `${t("message")} ${baseUrl}/stem`;

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
              const subject = t("emailSubject");

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
                        <a
                          href={`mailto:${c.contactEmail}`}
                          className="text-xs text-melon-green hover:underline"
                        >
                          {c.contactEmail}
                        </a>
                      )}
                    </div>
                    {getBadge(c)}
                  </div>

                  {/* Share buttons row */}
                  <div className="flex gap-1.5 flex-wrap">
                    {c.contactEmail && (
                      <a
                        href={`mailto:${c.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}
                        className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        {sh("email")}
                      </a>
                    )}
                    <a
                      href={`sms:?body=${encodeURIComponent(message)}`}
                      className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {sh("sms")}
                    </a>
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
