"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import InviteSection from "@/components/features/InviteSection";
import CandidatePublicForm from "@/components/features/CandidatePublicForm";
import { useTranslations } from "next-intl";

interface BallotVoteFormProps {
  token: string;
  role?: string;
  candidateId?: string;
}

type Status = "loading" | "ready" | "submitting" | "voted" | "used" | "expired" | "not_found" | "already_voted" | "error";

export default function BallotVoteForm({ token, role, candidateId }: BallotVoteFormProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [voteValue, setVoteValue] = useState(true);
  const [isCandidate, setIsCandidate] = useState(false);
  const [optingOut, setOptingOut] = useState(false);
  const [optedOut, setOptedOut] = useState(false);
  const router = useRouter();
  const t = useTranslations("ballot");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const fromUrl = role === "c";
      const fromStorage = localStorage.getItem("stem_palaestina_role") === "candidate";
      setIsCandidate(fromUrl || fromStorage);
    }
  }, [role]);

  useEffect(() => {
    // Check ballot validity
    fetch(`/api/ballot/check?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        const s = data.status as string;
        if (s === "valid") {
          setStatus("ready");
        } else {
          setStatus(s as Status);
        }
      })
      .catch(() => {
        setStatus("error");
      });
  }, [token]);

  async function handleSubmitVote() {
    setStatus("submitting");
    setError("");

    const deviceId = typeof window !== "undefined"
      ? localStorage.getItem("stem_device_id") || undefined
      : undefined;

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, voteValue, deviceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setStatus("error");
        return;
      }

      // Mark device as voted locally
      if (typeof window !== "undefined") {
        localStorage.setItem("stem_palaestina_voted", "true");
        localStorage.setItem("stem_palaestina_vote", voteValue ? "true" : "false");
      }

      // Voter → redirect to results
      const fromUrl = role === "c";
      const fromStorage = typeof window !== "undefined" && localStorage.getItem("stem_palaestina_role") === "candidate";
      if (!fromUrl && !fromStorage) {
        router.push("/");
        return;
      }

      // Candidate: try auto-claim if an on-list candidate was selected
      const cid = candidateId || (typeof window !== "undefined" ? localStorage.getItem("stem_palaestina_candidate_id") : null);
      if (cid && cid !== "new") {
        try {
          const claimRes = await fetch("/api/candidate/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              candidateId: Number(cid),
              token,
            }),
          });
          if (claimRes.ok) {
            if (typeof window !== "undefined") {
              localStorage.removeItem("stem_palaestina_candidate_id");
            }
            router.push("/");
            return;
          }
        } catch {
          // Network error → fall through to CandidatePublicForm
        }
      }

      // Off-list or claim failed → show registration form
      if (typeof window !== "undefined") {
        localStorage.removeItem("stem_palaestina_candidate_id");
      }
      setStatus("voted");
    } catch {
      setError(t("networkError"));
      setStatus("error");
    }
  }

  async function handleOptout() {
    setOptingOut(true);
    try {
      const res = await fetch("/api/optout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setOptedOut(true);
      }
    } catch {
      // Silent fail
    } finally {
      setOptingOut(false);
    }
  }

  function renderOptoutLink() {
    if (optedOut) {
      return (
        <p className="text-center text-xs text-gray-400">
          {t("optedOutConfirm")}
        </p>
      );
    }
    return (
      <button
        onClick={handleOptout}
        disabled={optingOut}
        className="block w-full text-center text-xs text-gray-400 hover:text-gray-600 underline disabled:opacity-50"
      >
        {t("optoutLink")}
      </button>
    );
  }

  if (status === "loading") {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-melon-green border-t-transparent" />
        <p className="mt-4 text-gray-600">{t("loading")}</p>
      </div>
    );
  }

  if (status === "submitting") {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-melon-green border-t-transparent" />
        <p className="mt-4 text-gray-600">{t("autoSubmitting")}</p>
      </div>
    );
  }

  // ── Vote choice screen ──
  if (status === "ready") {
    return (
      <div className="space-y-6 py-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">{t("yourBallot")}</h2>
          <p className="text-gray-600 text-sm">{t("question")}</p>
        </div>

        {/* Ja/Nej toggle */}
        <div className="flex gap-3">
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="vote"
              checked={voteValue === true}
              onChange={() => setVoteValue(true)}
              className="sr-only peer"
            />
            <div className="flex items-center justify-center rounded-lg border-2 border-gray-200 py-4 text-base font-bold transition-colors peer-checked:border-melon-green peer-checked:bg-melon-green/5 peer-checked:text-melon-green">
              {t("yes")}
            </div>
          </label>
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="vote"
              checked={voteValue === false}
              onChange={() => setVoteValue(false)}
              className="sr-only peer"
            />
            <div className="flex items-center justify-center rounded-lg border-2 border-gray-200 py-4 text-base font-bold transition-colors peer-checked:border-melon-red peer-checked:bg-red-50 peer-checked:text-melon-red">
              {t("no")}
            </div>
          </label>
        </div>

        <p className="text-xs text-gray-400 text-center">{t("anonNote")}</p>

        <button
          onClick={handleSubmitVote}
          className="w-full rounded-lg bg-melon-green py-3 text-sm font-bold text-white transition-colors hover:bg-melon-green/90"
        >
          {t("send")}
        </button>

        {renderOptoutLink()}
      </div>
    );
  }

  if (status === "voted" && isCandidate) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-melon-green/10 mb-4">
            <svg
              className="h-8 w-8 text-melon-green"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">{t("thanksTitle")}</h2>
          <p className="text-gray-600">{t("thanksCandidate")}</p>
        </div>
        <CandidatePublicForm token={token} />
        <a
          href="/"
          className="block text-center text-sm text-melon-green hover:underline"
        >
          {t("viewResults")}
        </a>
        <InviteSection />
      </div>
    );
  }

  if ((status === "used" || status === "already_voted") && isCandidate) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-melon-green/10 mb-4">
            <svg
              className="h-8 w-8 text-melon-green"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">{t("thanksTitle")}</h2>
          <p className="text-gray-600">{t("thanksCandidate")}</p>
        </div>
        <CandidatePublicForm token={token} />
        <a
          href="/"
          className="block text-center text-sm text-melon-green hover:underline"
        >
          {t("viewResults")}
        </a>
      </div>
    );
  }

  if (status === "used" || status === "already_voted") {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-melon-green/10 mb-4">
            <svg
              className="h-8 w-8 text-melon-green"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">{t("alreadyVotedTitle")}</h2>
          <p className="text-gray-600">{t("alreadyVotedText")}</p>
        </div>
        <InviteSection />
        {renderOptoutLink()}
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">{t("expiredTitle")}</h2>
        <p className="text-gray-600">
          {t.rich("expiredText", {
            link: (chunks) => (
              <a href="/" className="text-melon-green hover:underline">
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>
    );
  }

  // status === "not_found" || "error"
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-bold mb-2">{t("invalidTitle")}</h2>
      <p className="text-gray-600">
        {error || t.rich("invalidText", {
          link: (chunks) => (
            <a href="/" className="text-melon-green hover:underline">
              {chunks}
            </a>
          ),
        })}
      </p>
    </div>
  );
}
