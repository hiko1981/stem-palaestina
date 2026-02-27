"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export type PostVoteTab = "results" | "map" | "about";

interface BottomTabBarProps {
  activeTab?: PostVoteTab;
  onTabChange?: (tab: PostVoteTab) => void;
}

// check-circle icon
const iconResults = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);
// map icon
const iconMap = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
  </svg>
);
// information-circle icon
const iconAbout = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

const postVoteTabs: { key: PostVoteTab; icon: React.ReactNode }[] = [
  { key: "results", icon: iconResults },
  { key: "map", icon: iconMap },
  { key: "about", icon: iconAbout },
];

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const t = useTranslations("nav");

  useEffect(() => {
    setHasVoted(localStorage.getItem("stem_palaestina_voted") === "true");
  }, []);

  if (hasVoted && onTabChange) {
    return (
      <nav
        className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around h-14">
          {postVoteTabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors ${
                  active
                    ? "text-melon-green"
                    : "text-gray-400 active:text-gray-600"
                }`}
              >
                {tab.icon}
                <span>{t(tab.key)}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // Pre-vote: simple nav links
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-14">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium text-melon-green"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t("vote")}</span>
        </button>
        <a
          href="/om"
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium text-gray-400 active:text-gray-600"
        >
          {iconAbout}
          <span>{t("about")}</span>
        </a>
      </div>
    </nav>
  );
}
