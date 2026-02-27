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

interface ResultsViewProps {
  candidatesOnly?: boolean;
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
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${bg}`}
    >
      {initials}
    </div>
  );
}

function partyLetter(party: string): string {
  return party.match(/\(([^)]+)\)/)?.[1] ?? party;
}

export default function ResultsView({ candidatesOnly = false }: ResultsViewProps) {
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [candidates, setCandidates] = useState<CandidateVote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storkreds, setStorkreds] = useState("");
  const [party, setParty] = useState("");
  // candidateListOpen state removed — now always visible in two columns

  const t = useTranslations("results");
  const vc = useTranslations("voteCounter");
  const st = useTranslations("storkredse");
  const cs = useTranslations("candidateSelect");

  useEffect(() => {
    const fetches: Promise<unknown>[] = [
      fetch("/api/votes/candidates").then((r) => r.json()),
    ];
    if (!candidatesOnly) {
      fetches.unshift(fetch("/api/votes/count").then((r) => r.json()));
    }

    Promise.all(fetches)
      .then((results) => {
        if (candidatesOnly) {
          if (Array.isArray(results[0])) setCandidates(results[0] as CandidateVote[]);
        } else {
          setVoteData(results[0] as VoteData);
          if (Array.isArray(results[1])) setCandidates(results[1] as CandidateVote[]);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [candidatesOnly]);

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

  const candidateSection = (
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

      {/* Candidate list — two columns: Ja / Nej */}
      {votedCandidates.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {/* Ja column */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-2 w-2 rounded-full bg-melon-green" />
              <span className="text-xs font-semibold text-melon-green">
                {t("yes")} ({candidateJa})
              </span>
            </div>
            <div className="space-y-1">
              {filtered
                .filter((c) => c.voteValue === true)
                .map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5 rounded-lg px-1.5 py-1">
                    <Initials name={c.name} color="green" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate leading-tight">{c.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{partyLetter(c.party)}</p>
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
                {t("no")} ({candidateNej})
              </span>
            </div>
            <div className="space-y-1">
              {filtered
                .filter((c) => c.voteValue === false)
                .map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5 rounded-lg px-1.5 py-1">
                    <Initials name={c.name} color="red" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate leading-tight">{c.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{partyLetter(c.party)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (candidatesOnly) {
    return candidateSection;
  }

  return (
    <div className="space-y-5">
      {/* Public votes — compact */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {t("publicVotesTitle")}
        </h3>

        {voteData && voteData.total > 0 ? (
          voteData.thresholdReached &&
          voteData.ja !== null &&
          voteData.nej !== null ? (
            <PercentBar ja={voteData.ja} nej={voteData.nej} t={t} />
          ) : (
            <p className="text-sm text-gray-500">
              {voteData.total} {voteData.total === 1 ? vc("singular") : vc("plural")}.{" "}
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
      {candidateSection}
    </div>
  );
}
