import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const nav = await getTranslations("nav");
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-gray-100 bg-white mt-auto">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-col items-center gap-3 text-xs text-gray-400">
          <div className="flex gap-5">
            <Link href="/om" className="hover:text-melon-green transition-colors">
              {nav("about")}
            </Link>
            <Link href="/kandidater" className="hover:text-melon-green transition-colors">
              {nav("candidates")}
            </Link>
            <Link href="/stem-danmark" className="hover:text-melon-green transition-colors">
              {nav("results")}
            </Link>
          </div>
          <p>{t("anonymous")}</p>
          {/* Watermelon slice bar */}
          <div className="flex h-1.5 w-32 overflow-hidden rounded-full">
            <div className="flex-1 bg-melon-green" />
            <div className="w-0.5 bg-white" />
            <div className="flex-[2] bg-melon-red" />
            <div className="w-1 bg-melon-seed" />
            <div className="flex-[2] bg-melon-red" />
            <div className="w-0.5 bg-white" />
            <div className="flex-1 bg-melon-green" />
          </div>
        </div>
      </div>
    </footer>
  );
}
