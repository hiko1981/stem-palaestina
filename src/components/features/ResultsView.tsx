"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { STORKREDSE } from "@/lib/storkredse";
import { VOTE_BUNDLE_THRESHOLD } from "@/lib/constants";

interface VoteData {
  total: number;
  ja: number | null;
  nej: number | null;
  thresholdReached: boolean;
  candidateCount: number;
}

interface CandidateVote {
  id: number;
  name: string;
  party: string;
  constituency: string;
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
      <p className="text-xs text-gray-400 mt-1">
        {ja} {t("yes").toLowerCase()} &middot; {nej} {t("no").toLowerCase()}{" "}
        &middot; {total} {t("votes")}
      </p>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function ResultsView() {
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [candidates, setCandidates] = useState<CandidateVote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storkreds, setStorkreds] = useState("");
  const [party, setParty] = useState("");
  const [candidateListOpen, setCandidateListOpen] = useState(false);

  const t = useTranslations("results");
  const st = useTranslations("storkredse");
  const ct = useTranslations("constituency");
  const cs = useTranslations("candidateSelect");

  useEffect(() => {
    Promise.all([
      fetch("/api/votes/count").then((r) => r.json()),
      fetch("/api/votes/candidates").then((r) => r.json()),
    ])
      .then(([votes, cands]) => {
        setVoteData(votes);
        if (Array.isArray(cands)) setCandidates(cands);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Reset party when storkreds changes
  useEffect(() => {
    setParty("");
  }, [storkreds]);

  if (!loaded) return null;

  // --- Candidate filtering ---
  const storkredsName = STORKREDSE.find((s) => s.id === storkreds)?.name;
  const kredsFiltered = storkreds
    ? candidates.filter((c) => c.constituency === storkredsName)
    : candidates;
  const parties = [...new Set(kredsFiltered.map((c) => c.party))].sort();
  const filtered = party
    ? kredsFiltered.filter((c) => c.party === party)
    : kredsFiltered;

  // Candidate vote counts (only candidates who have voted)
  const votedCandidates = filtered.filter((c) => c.voteValue !== null);
  const candidateJa = votedCandidates.filter(
    (c) => c.voteValue === true,
  ).length;
  const candidateNej = votedCandidates.filter(
    (c) => c.voteValue === false,
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">{t("title")}</h2>
        <p className="text-xs text-gray-400 mt-1">
          {t("bundleNote", { threshold: VOTE_BUNDLE_THRESHOLD })}
        </p>
      </div>

      {/* Public votes */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {t("publicVotesTitle")}
          </h3>
          <p className="text-xs text-gray-400">{t("publicVotesSubtitle")}</p>
        </div>

        {voteData && voteData.total > 0 ? (
          voteData.thresholdReached &&
          voteData.ja !== null &&
          voteData.nej !== null ? (
            <PercentBar ja={voteData.ja} nej={voteData.nej} t={t} />
          ) : (
            <p className="text-sm text-gray-500">
              {t("belowThreshold", {
                count: voteData.total,
                threshold: VOTE_BUNDLE_THRESHOLD,
              })}
            </p>
          )
        ) : (
          <p className="text-sm text-gray-400">{t("noVotesYet")}</p>
        )}
      </div>

      {/* Candidate votes */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {t("candidateVotesTitle")}
        </h3>

        {/* Filters */}
        <div className="space-y-2">
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-melon-green focus:outline-none"
            value={storkreds}
            onChange={(e) => setStorkreds(e.target.value)}
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
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-melon-green focus:outline-none"
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
        {votedCandidates.length > 0 ? (
          <PercentBar ja={candidateJa} nej={candidateNej} t={t} />
        ) : (
          <p className="text-sm text-gray-400">{t("noCandidatesYet")}</p>
        )}

        {/* Candidate list (collapsible) */}
        {filtered.length > 0 && (
          <div>
            <button
              onClick={() => setCandidateListOpen(!candidateListOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>
                {t("candidateVotesTitle")} ({filtered.length})
              </span>
              <ChevronIcon open={candidateListOpen} />
            </button>

            {candidateListOpen && (
              <div className="mt-2 space-y-1.5">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {c.party} &middot; {c.constituency}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.voteValue === true
                          ? "bg-melon-green/10 text-melon-green"
                          : c.voteValue === false
                            ? "bg-melon-red/10 text-melon-red"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.voteValue === true
                        ? t("yes")
                        : c.voteValue === false
                          ? t("no")
                          : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
