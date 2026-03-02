"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function BackButton() {
  const router = useRouter();
  const t = useTranslations("vote");

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {t("back")}
    </button>
  );
}
