"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

function isMobileUa(ua: string) {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
}

function detectDesktop(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const anyNav = navigator as unknown as {
    userAgentData?: { mobile?: boolean };
  };
  const uaMobile = anyNav.userAgentData?.mobile;
  const isMobile =
    typeof uaMobile === "boolean" ? uaMobile : isMobileUa(ua);
  if (isMobile) return false;
  const wide = window.matchMedia?.("(min-width: 820px)")?.matches ?? false;
  const finePointer =
    window.matchMedia?.("(pointer: fine)")?.matches ?? false;
  const hover = window.matchMedia?.("(hover: hover)")?.matches ?? false;
  return wide || (finePointer && hover);
}

interface MobileGateProps {
  children: ReactNode;
}

export default function MobileGate({ children }: MobileGateProps) {
  const [isDesktop, setIsDesktop] = useState(() => detectDesktop());
  const t = useTranslations("mobileGate");

  useEffect(() => {
    const update = () => setIsDesktop(detectDesktop());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (isDesktop) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-6">
          <svg
            className="h-10 w-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-3">{t("title")}</h1>
        <p className="text-gray-600 mb-6">{t("text")}</p>
        <p className="text-sm text-gray-400">{t("hint")}</p>
      </div>
    );
  }

  return <>{children}</>;
}
