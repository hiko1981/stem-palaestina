"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import InviteSection from "@/components/features/InviteSection";
import CandidatePublicForm from "@/components/features/CandidatePublicForm";
import { useTranslations } from "next-intl";

interface BallotVoteFormProps {
  token: string;
}

type Status = "loading" | "submitting" | "voted" | "used" | "expired" | "not_found" | "already_voted" | "error";

export default function BallotVoteForm({ token }: BallotVoteFormProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [isCandidate, setIsCandidate] = useState(false);
  const submitted = useRef(false);
  const router = useRouter();
  const t = useTranslations("ballot");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsCandidate(localStorage.getItem("stem_palaestina_role") === "candidate");
    }
  }, []);

  useEffect(() => {
    // Check ballot validity then auto-submit
    fetch(`/api/ballot/check?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        const s = data.status as string;
        if (s === "valid") {
          autoSubmit();
        } else {
          setStatus(s as Status);
        }
      })
      .catch(() => {
        setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function autoSubmit() {
    if (submitted.current) return;
    submitted.current = true;
    setStatus("submitting");

    // Read vote from localStorage (default: true)
    const storedVote = typeof window !== "undefined"
      ? localStorage.getItem("stem_palaestina_vote")
      : null;
    const voteValue = storedVote === "false" ? false : true;

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, voteValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setStatus("error");
        return;
      }
      localStorage.setItem("stem_palaestina_voted", "true");

      // Voter → redirect to results
      const role = localStorage.getItem("stem_palaestina_role");
      if (role !== "candidate") {
        router.push("/");
        return;
      }

      // Candidate: try auto-claim if an on-list candidate was selected
      const candidateId = localStorage.getItem("stem_palaestina_candidate_id");
      if (candidateId && candidateId !== "new") {
        try {
          const claimRes = await fetch("/api/candidate/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              candidateId: Number(candidateId),
              token,
            }),
          });
          if (claimRes.ok) {
            localStorage.removeItem("stem_palaestina_candidate_id");
            router.push("/");
            return;
          }
          // Claim failed (already taken) → fall through to CandidatePublicForm
        } catch {
          // Network error → fall through to CandidatePublicForm
        }
      }

      // Off-list or claim failed → show registration form
      localStorage.removeItem("stem_palaestina_candidate_id");
      setStatus("voted");
    } catch {
      setError(t("networkError"));
      setStatus("error");
    }
  }

  if (status === "loading" || status === "submitting") {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-melon-green border-t-transparent" />
        <p className="mt-4 text-gray-600">
          {status === "submitting" ? t("autoSubmitting") : t("loading")}
        </p>
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
