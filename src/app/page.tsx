"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import CountryCodeSelect from "@/components/features/CountryCodeSelect";
import CandidateSelect from "@/components/features/CandidateSelect";
import CandidateBoard from "@/components/features/CandidateBoard";
import PhoneNote from "@/components/ui/PhoneNote";
import SharePanel from "@/components/features/SharePanel";
import SupportForm from "@/components/features/SupportForm";
import DenmarkMap from "@/components/features/DenmarkMap";
import BottomTabBar, { type TabKey } from "@/components/layout/BottomTabBar";
import { getDeviceId, setDeviceVoted, getDeviceVoted } from "@/lib/device-cookie";
import ResultsView from "@/components/features/ResultsView";
import PublicVoteBar from "@/components/features/PublicVoteBar";
import { useTranslations } from "next-intl";

type ActivePanel = "voter" | "candidate" | "invite" | null;

function AboutContent() {
  const t = useTranslations("about");
  const d = useTranslations("demands");
  const s = useTranslations("support");

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

      <Card>
        <h2 className="text-xl font-bold mb-3">{s("title")}</h2>
        <SupportForm />
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
  const [hasVoted, setHasVoted] = useState(false);
  const [votedYes, setVotedYes] = useState(true);
  const [participationLoaded, setParticipationLoaded] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>("voter");
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("+45");
  const [phoneError, setPhoneError] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("vote");
  const [mapStorkreds, setMapStorkreds] = useState("");
  const [notification, setNotification] = useState("");

  const t = useTranslations("vote");
  const b = useTranslations("ballot");
  const d = useTranslations("demands");
  const h = useTranslations("home");
  const sp = useTranslations("sharePanel");

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Get or create device ID (synced to both localStorage and cookie)
      const deviceId = getDeviceId();

      // Deep linking: ?panel=candidate or ?panel=invite
      const params = new URLSearchParams(window.location.search);
      const panel = params.get("panel");
      if (panel === "candidate") setActivePanel("candidate");
      else if (panel === "invite") setActivePanel("invite");
      else if (panel === "voter") setActivePanel("voter");

      // Check participation server-side, fall back to localStorage/cookie
      fetch(`/api/participation?deviceId=${encodeURIComponent(deviceId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.participated) {
            const val = data.voteValue !== null && data.voteValue !== undefined ? data.voteValue : true;
            setDeviceVoted(val);
            setVotedYes(val);
            setHasVoted(true);
          } else {
            // Fall back to localStorage/cookie
            const { voted, voteValue } = getDeviceVoted();
            if (voted) setVotedYes(voteValue);
            setHasVoted(voted);
          }
          setParticipationLoaded(true);
        })
        .catch(() => {
          const { voted, voteValue } = getDeviceVoted();
          if (voted) setVotedYes(voteValue);
          setHasVoted(voted);
          setParticipationLoaded(true);
        });

      // Check for targeted one-time notifications
      if (deviceId) {
        fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.message) {
              setNotification(data.message);
              // Reset vote state — user needs to re-vote
              localStorage.removeItem("stem_palaestina_voted");
              localStorage.removeItem("stem_palaestina_vote");
              localStorage.removeItem("stem_palaestina_role");
              localStorage.removeItem("stem_palaestina_candidate_id");
              setHasVoted(false);
            }
          })
          .catch(() => {});
      }
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
      // Phone already voted — reclaim vote state for this context
      if (data.alreadyVoted) {
        const val = data.voteValue ?? true;
        setDeviceVoted(val);
        setVotedYes(val);
        setHasVoted(true);
        return;
      }
      setSmsSent(true);
    } catch {
      setPhoneError(b("networkError"));
    } finally {
      setPhoneLoading(false);
    }
  }

  if (!participationLoaded) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-melon-green border-t-transparent" />
      </div>
    );
  }

  // ───── ONE-TIME NOTIFICATION BANNER ─────
  const notificationBanner = notification ? (
    <div className="mx-auto max-w-xl px-4 pt-4">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 relative">
        <button
          onClick={() => setNotification("")}
          className="absolute top-2 end-2 text-amber-400 hover:text-amber-600 text-lg leading-none"
          aria-label="Luk"
        >
          &times;
        </button>
        <p className="text-sm text-amber-800 pe-6">{notification}</p>
      </div>
    </div>
  ) : null;

  // ───── POST-VOTE STATE ─────
  if (hasVoted) {
    // Post-vote: default to results if still on "vote"
    const postTab = activeTab === "vote" ? "results" : activeTab;

    return (
      <>
        {notificationBanner}
        <div className="mx-auto max-w-xl px-4 py-6 pb-24">
          <PublicVoteBar />
          {postTab === "results" && (
            <div className="space-y-5">
              {/* Your vote + 3 demands */}
              <div>
                <p className="text-xs text-gray-400 mb-1">{h("yourVote")}</p>
                <ul className="space-y-1">
                  {[d("d1Title"), d("d2Title"), d("d3Title")].map((demand, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${votedYes ? "bg-melon-green/10 text-melon-green" : "bg-melon-red/10 text-melon-red"}`}>
                        {votedYes ? "✓" : "✗"}
                      </span>
                      <span className="text-gray-700">{demand}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Results (public + candidate) */}
              <ResultsView />

              {/* Share */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {sp("title")}
                </h3>
                <SharePanel />
              </div>
            </div>
          )}

          {postTab === "map" && (
            <div className="space-y-5">
              <DenmarkMap selected={mapStorkreds} onSelect={setMapStorkreds} />
              <CandidateBoard storkreds={mapStorkreds} onStorkredsChange={setMapStorkreds} />
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
      <div className="flex gap-2 min-w-0">
        <CountryCodeSelect value={dialCode} onChange={handleDialCode} />
        <input
          id="phone"
          type="tel"
          placeholder="12345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-melon-green focus:border-transparent focus:outline-none"
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
      <p className="text-center text-xs text-gray-400">{b("voteInSmsNote")}</p>
      <PhoneNote />
      {phoneError && (
        <p className="text-center text-sm text-melon-red">{phoneError}</p>
      )}
    </div>
  );

  return (
    <>
      {notificationBanner}
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

            {/* Purpose description */}
            <p className="text-center text-sm text-gray-500 mb-4 leading-relaxed">
              {h("intro")}
            </p>

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

            {/* ── Accordion panels ── */}
            <div className="space-y-2 mb-4">
              {/* Panel 1: Jeg er vælger */}
              <div className={`rounded-lg border overflow-hidden transition-colors ${activePanel === "voter" ? "border-melon-green" : "border-gray-200"}`}>
                <button
                  onClick={() => togglePanel("voter")}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold transition-colors ${activePanel === "voter" ? "bg-melon-green/5 text-melon-green" : "hover:bg-gray-50"}`}
                >
                  {t("voterTitle")}
                  <ChevronIcon open={activePanel === "voter"} />
                </button>
                {activePanel === "voter" && (
                  <div className="px-3 pb-3 space-y-3 animate-in slide-in-from-top-2">
                    <p className="text-xs text-gray-500 text-center">
                      {h("voteOnPhoneHint")}
                    </p>
                    {phoneInput}
                  </div>
                )}
              </div>

              {/* Panel 2: Jeg er kandidat */}
              <div className={`rounded-lg border overflow-hidden transition-colors ${activePanel === "candidate" ? "border-melon-green" : "border-gray-200"}`}>
                <button
                  onClick={() => togglePanel("candidate")}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold transition-colors ${activePanel === "candidate" ? "bg-melon-green/5 text-melon-green" : "hover:bg-gray-50"}`}
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
                    />
                  </div>
                )}
              </div>

              {/* Panel 3: Del med venner og kandidater */}
              <div className={`rounded-lg border overflow-hidden transition-colors ${activePanel === "invite" ? "border-melon-green" : "border-gray-200"}`}>
                <button
                  onClick={() => togglePanel("invite")}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold transition-colors ${activePanel === "invite" ? "bg-melon-green/5 text-melon-green" : "hover:bg-gray-50"}`}
                >
                  {sp("title")}
                  <ChevronIcon open={activePanel === "invite"} />
                </button>
                {activePanel === "invite" && (
                  <div className="px-3 pb-3 animate-in slide-in-from-top-2">
                    <SharePanel />
                  </div>
                )}
              </div>
            </div>

            {/* Privacy note moved under each phone input */}
          </>
        )}

        {activeTab === "results" && (
          <div className="space-y-5 py-2">
            <PublicVoteBar />
            <ResultsView />
          </div>
        )}

        {activeTab === "map" && (
          <div className="space-y-5 py-2">
            <DenmarkMap selected={mapStorkreds} onSelect={setMapStorkreds} />
            <CandidateBoard storkreds={mapStorkreds} onStorkredsChange={setMapStorkreds} />
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
