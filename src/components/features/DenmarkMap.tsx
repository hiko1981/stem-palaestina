"use client";

import { useState, useEffect } from "react";
import { STORKREDSE, STORKREDS_PATHS, type StorkredsId } from "@/lib/storkredse";
import { useTranslations } from "next-intl";

interface CandidateInfo {
  name: string;
  party: string;
  constituency: string;
  verified: boolean;
  voteValue: boolean | null;
}

export default function DenmarkMap() {
  const [selected, setSelected] = useState<StorkredsId | null>(null);
  const [hovered, setHovered] = useState<StorkredsId | null>(null);
  const [candidates, setCandidates] = useState<CandidateInfo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const t = useTranslations("map");
  const st = useTranslations("storkredse");

  useEffect(() => {
    fetch("/api/votes/candidates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCandidates(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function candidatesInRegion(id: StorkredsId) {
    const storkreds = STORKREDSE.find((s) => s.id === id);
    if (!storkreds) return [];
    return candidates.filter((c) => c.constituency === storkreds.name);
  }

  function getColor(id: StorkredsId) {
    const count = candidatesInRegion(id).length;
    if (id === selected) return "#15803d"; // green-700
    if (id === hovered) return "#22c55e"; // green-500
    if (count === 0) return "#e5e7eb"; // gray-200
    if (count === 1) return "#bbf7d0"; // green-200
    if (count <= 3) return "#86efac"; // green-300
    return "#4ade80"; // green-400
  }

  const selectedCandidates = selected ? candidatesInRegion(selected) : [];

  return (
    <div className="space-y-4">
      <h3 className="text-center text-lg font-bold">{t("title")}</h3>
      <p className="text-center text-sm text-gray-500">{t("selectRegion")}</p>

      <div className="flex justify-center">
        <svg
          viewBox="20 85 290 260"
          className="w-full max-w-xs"
          role="img"
          aria-label="Danmark storkredskort"
        >
          {STORKREDSE.map((s) => (
            <path
              key={s.id}
              d={STORKREDS_PATHS[s.id]}
              fill={getColor(s.id)}
              stroke="#fff"
              strokeWidth="2"
              className="cursor-pointer transition-colors duration-150"
              onClick={() => setSelected(selected === s.id ? null : s.id)}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <title>{st(s.id)}</title>
            </path>
          ))}
        </svg>
      </div>

      {selected && loaded && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
          <h4 className="font-bold text-sm">{st(selected)}</h4>
          {selectedCandidates.length === 0 ? (
            <p className="text-sm text-gray-500">{t("noCandidates")}</p>
          ) : (
            <div className="space-y-2">
              {selectedCandidates.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.party}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      !c.verified && c.voteValue === null
                        ? "bg-amber-100 text-amber-700"
                        : c.voteValue === true
                          ? "bg-melon-green/10 text-melon-green"
                          : c.voteValue === false
                            ? "bg-melon-red/10 text-melon-red"
                            : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {!c.verified && c.voteValue === null
                      ? t("unclaimed")
                      : c.voteValue === true
                        ? "Ja ✓"
                        : c.voteValue === false
                          ? "Nej ✗"
                          : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
