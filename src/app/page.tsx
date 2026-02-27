"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import CountryCodeSelect from "@/components/features/CountryCodeSelect";
import InviteSection from "@/components/features/InviteSection";
import InviteCandidateButton from "@/components/features/InviteCandidateButton";
import CandidateSelect from "@/components/features/CandidateSelect";
import VoteCounter from "@/components/features/VoteCounter";
import DenmarkMap from "@/components/features/DenmarkMap";
import BottomTabBar, { type TabKey } from "@/components/layout/BottomTabBar";
import CandidateVotes from "@/components/features/CandidateVotes";
import { useTranslations } from "next-intl";

type ActivePanel = "voter" | "candidate" | "invite" | null;

function AboutContent() {
  const t = useTranslations("about");
  const d = useTranslations("demands");

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold mb-3">{t("whatTitle")}</h2>
        <p className="text-gray-600 leading-relaxed">{t("whatText")}</p>
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-3">{t("howTitle")}</h2>
        <div className="text-gray-600 leading-relaxed space-y-3">
          <p>{t("howIntro")}</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>{t("howStep1Title")}</strong> {t("howStep1Text")}
            </li>
            <li>
              <strong>{t("howStep2Title")}</strong> {t("howStep2Text")}
            </li>
            <li>
              <strong>{t("howStep3Title")}</strong> {t("howStep3Text")}
            </li>
          </ol>
          <p className="text-sm font-medium">{t("howPrivacy")}</p>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-3">{t("bundleTitle")}</h2>
        <p className="text-gray-600 leading-relaxed">{t("bundleText")}</p>
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-3">{t("demandsTitle")}</h2>
        <div className="text-gray-600 leading-relaxed space-y-3">
          <div>
            <h3 className="font-semibold text-gray-800">1. {d("d1Title")}</h3>
            <p className="text-sm">{d("d1Long")}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">2. {d("d2Title")}</h3>
            <p className="text-sm">{d("d2Long")}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">3. {d("d3Title")}</h3>
            <p className="text-sm">{d("d3Long")}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-3">{t("securityTitle")}</h2>
        <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
          <li>{t("security1")}</li>
          <li>{t("security2")}</li>
          <li>{t("security3")}</li>
          <li>{t("security4")}</li>
          <li>{t("security5")}</li>
        </ul>
      </Card>
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

export default function Home() {
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);
  const [voteValue, setVoteValue] = useState(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("+45");
  const [phoneError, setPhoneError] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("vote");

  const t = useTranslations("vote");
  const b = useTranslations("ballot");
  const d = useTranslations("demands");
  const h = useTranslations("home");
  const cl = useTranslations("candidateList");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!localStorage.getItem("stem_device_id")) {
        localStorage.setItem("stem_device_id", crypto.randomUUID());
      }
      setHasVoted(localStorage.getItem("stem_palaestina_voted") === "true");
    }
  }, []);

  const handleDialCode = useCallback((code: string) => {
    setDialCode(code);
  }, []);

  function togglePanel(panel: ActivePanel) {
    if (activePanel === panel) {
      setActivePanel(null);
    } else {
      setActivePanel(panel);
      setSmsSent(false);
      setPhoneError("");
      setPhone("");
    }
  }

  async function handleSendBallot() {
    if (typeof window !== "undefined") {
      localStorage.setItem("stem_palaestina_vote", voteValue ? "true" : "false");
      localStorage.setItem("stem_palaestina_role", "voter");
    }
    setPhoneError("");
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/ballot/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          dialCode,
          deviceId:
            typeof window !== "undefined"
              ? localStorage.getItem("stem_device_id") || undefined
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneError(data.error);
        return;
      }
      setSmsSent(true);
    } catch {
      setPhoneError(b("networkError"));
    } finally {
      setPhoneLoading(false);
    }
  }

  // Wait for localStorage check
  if (hasVoted === null) return null;

  // ───── POST-VOTE STATE ─────
  if (hasVoted) {
    const storedVote = typeof window !== "undefined"
      ? localStorage.getItem("stem_palaestina_vote")
      : null;
    // Post-vote: default to results if still on "vote"
    const postTab = activeTab === "vote" ? "results" : activeTab;

    return (
      <>
        <div className="mx-auto max-w-xl px-4 py-8">
          {postTab === "results" && (
            <div className="space-y-8">
              {/* Your vote */}
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">{h("yourVote")}</p>
                <p className={`text-lg font-bold ${storedVote === "false" ? "text-melon-red" : "text-melon-green"}`}>
                  {storedVote === "false" ? h("yourVoteNo") : h("yourVoteYes")}
                </p>
              </div>

              {/* National aggregate */}
              <Card>
                <VoteCounter variant="full" />
              </Card>

              {/* Invite */}
              <Card>
                <InviteSection />
              </Card>
            </div>
          )}

          {postTab === "map" && (
            <div className="space-y-8">
              <DenmarkMap />
              <Card>
                <InviteCandidateButton />
              </Card>
            </div>
          )}

          {postTab === "about" && <AboutContent />}
        </div>
        <BottomTabBar activeTab={postTab} onTabChange={setActiveTab} />
      </>
    );
  }

  // ───── PRE-VOTE STATE ─────

  // SMS sent confirmation
  if (smsSent && activeTab === "vote") {
    return (
      <>
        <div className="mx-auto max-w-xl px-4 py-16">
          <Card>
            <div className="text-center py-8 space-y-3">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-melon-green/10 mb-2">
                <svg className="h-8 w-8 text-melon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">{b("sentTitle")}</h2>
              <p className="text-gray-600">{b("sentText")}</p>
            </div>
          </Card>
        </div>
        <BottomTabBar activeTab="vote" onTabChange={setActiveTab} />
      </>
    );
  }

  // Phone input shared by voter & candidate panels
  const phoneInput = (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-500">{b("phoneLabel")}</label>
      <div className="flex gap-2">
        <CountryCodeSelect value={dialCode} onChange={handleDialCode} />
        <input
          id="phone"
          type="tel"
          placeholder="12345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
        />
      </div>
      <Button
        onClick={handleSendBallot}
        loading={phoneLoading}
        disabled={!phone}
        className="w-full"
      >
        {b("send")}
      </Button>
      {phoneError && (
        <p className="text-center text-sm text-melon-red">{phoneError}</p>
      )}
    </div>
  );

  return (
    <>
      <div className="mx-auto max-w-xl px-4 pt-6 pb-24">
        {activeTab === "vote" && (
          <>
            {/* Compact hero */}
            <div className="text-center mb-3">
              <p className="text-3xl mb-1" role="img" aria-label="vandmelon">&#127817;</p>
              <h1 className="text-xl font-extrabold tracking-tight">
                {h("heroTitle")}{" "}
                <span className="text-melon-green">{h("heroHighlight")}</span>
              </h1>
            </div>

            {/* 3 demands — compact numbered list */}
            <ul className="text-left text-sm text-gray-700 space-y-1.5 mb-4">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-melon-green-light text-melon-green text-xs font-bold">1</span>
                <span>{d("d1Title")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-melon-green-light text-melon-green text-xs font-bold">2</span>
                <span>{d("d2Title")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-melon-green-light text-melon-green text-xs font-bold">3</span>
                <span>{d("d3Title")}</span>
              </li>
            </ul>

            {/* Ja/Nej radio toggle */}
            <div className="flex gap-2 mb-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="vote"
                  checked={voteValue === true}
                  onChange={() => setVoteValue(true)}
                  className="sr-only peer"
                />
                <div className="flex items-center justify-center rounded-lg border border-gray-200 py-2 text-sm font-semibold transition-colors peer-checked:border-melon-green peer-checked:bg-melon-green/5 peer-checked:text-melon-green">
                  {b("yes")}
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
                <div className="flex items-center justify-center rounded-lg border border-gray-200 py-2 text-sm font-semibold transition-colors peer-checked:border-melon-red peer-checked:bg-red-50 peer-checked:text-melon-red">
                  {b("no")}
                </div>
              </label>
            </div>

            {/* ── Accordion panels ── */}
            <div className="space-y-2 mb-4">
              {/* Panel 1: Jeg er vælger */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => togglePanel("voter")}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-gray-50"
                >
                  {t("voterTitle")}
                  <ChevronIcon open={activePanel === "voter"} />
                </button>
                {activePanel === "voter" && (
                  <div className="px-3 pb-3 animate-in slide-in-from-top-2">
                    {phoneInput}
                  </div>
                )}
              </div>

              {/* Panel 2: Jeg er kandidat */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => togglePanel("candidate")}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-gray-50"
                >
                  {t("candidateTitle")}
                  <ChevronIcon open={activePanel === "candidate"} />
                </button>
                {activePanel === "candidate" && (
                  <div className="px-3 pb-3 space-y-3 animate-in slide-in-from-top-2">
                    <CandidateSelect
                      onSelect={(value) => {
                        if (typeof window !== "undefined") {
                          localStorage.setItem("stem_palaestina_candidate_id", value);
                        }
                      }}
                      voteValue={voteValue}
                    />
                  </div>
                )}
              </div>

              {/* Panel 3: Inviter din lokale kandidat */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => togglePanel("invite")}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-gray-50"
                >
                  {cl("title")}
                  <ChevronIcon open={activePanel === "invite"} />
                </button>
                {activePanel === "invite" && (
                  <div className="px-3 pb-3 animate-in slide-in-from-top-2">
                    <InviteCandidateButton inline />
                  </div>
                )}
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">
              {t("privacyNote")}{" "}
              <a href="/om" className="underline hover:text-melon-green">
                {t("privacyLink")}
              </a>
              .
            </p>
          </>
        )}

        {activeTab === "results" && (
          <div className="space-y-8 py-2">
            <Card>
              <VoteCounter variant="full" />
            </Card>
            <Card>
              <CandidateVotes />
            </Card>
          </div>
        )}

        {activeTab === "map" && (
          <div className="space-y-8 py-2">
            <DenmarkMap />
            <Card>
              <InviteCandidateButton />
            </Card>
          </div>
        )}

        {activeTab === "about" && (
          <div className="py-2">
            <AboutContent />
          </div>
        )}
      </div>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
}
