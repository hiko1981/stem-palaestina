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

interface DenmarkMapProps {
  selected?: string;
  onSelect?: (id: string) => void;
}

export default function DenmarkMap({ selected: controlledSelected, onSelect }: DenmarkMapProps) {
  const [internalSelected, setInternalSelected] = useState<StorkredsId | null>(null);
  const [hovered, setHovered] = useState<StorkredsId | null>(null);
  const [candidates, setCandidates] = useState<CandidateInfo[]>([]);
  const t = useTranslations("map");
  const st = useTranslations("storkredse");

  // Use controlled value if provided
  const selected = (controlledSelected || internalSelected || null) as StorkredsId | null;

  useEffect(() => {
    fetch("/api/votes/candidates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCandidates(data);
      })
      .catch(() => {});
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

  function handleClick(id: StorkredsId) {
    const newVal = selected === id ? "" : id;
    if (onSelect) {
      onSelect(newVal);
    } else {
      setInternalSelected(newVal ? id : null);
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-center text-lg font-bold">{t("title")}</h3>
      <p className="text-center text-sm text-gray-500">{t("selectRegion")}</p>

      <div className="flex justify-center">
        <svg
          viewBox="-10 150 1050 1120"
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
              className="cursor-pointer transition-colors duration-150 focus:outline-none focus:stroke-[#15803d] focus:stroke-[3]"
              role="button"
              tabIndex={0}
              aria-label={st(s.id)}
              onClick={() => handleClick(s.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick(s.id);
                }
              }}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <title>{st(s.id)}</title>
            </path>
          ))}
        </svg>
      </div>
    </div>
  );
}
