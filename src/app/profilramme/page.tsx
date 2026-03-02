import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import ProfileFrameGenerator from "@/components/features/ProfileFrameGenerator";
import BackButton from "./BackButton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profileFrame");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function ProfilrammePage() {
  const t = await getTranslations("profileFrame");

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
      </div>
      <ProfileFrameGenerator />
    </div>
  );
}
