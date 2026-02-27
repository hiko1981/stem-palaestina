"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface CandidateVote {
  name: string;
  party: string;
  constituency: string;
  voteValue: boolean | null;
}

export default function CandidateVotes() {
  const [candidates, setCandidates] = useState<CandidateVote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const t = useTranslations("candidateVotes");

  useEffect(() => {
    fetch("/api/votes/candidates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCandidates(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || candidates.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-center text-sm font-medium text-gray-700">
        {t("title")}
      </h3>
      <div className="space-y-2">
        {candidates.map((c) => (
          <div
            key={c.name}
            className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-xs text-gray-500">
                {c.party} &middot; {c.constituency}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
                  : t("notVoted")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
