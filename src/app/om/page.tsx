import Card from "@/components/ui/Card";
import { getTranslations } from "next-intl/server";

export default async function OmPage() {
  const t = await getTranslations("about");
  const d = await getTranslations("demands");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-center text-3xl font-bold">{t("title")}</h1>

      <div className="space-y-8">
        <Card>
          <h2 className="text-xl font-bold mb-3">{t("whatTitle")}</h2>
          <p className="text-gray-600 leading-relaxed">
            {t("whatText")}
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-3">{t("howTitle")}</h2>
          <div className="text-gray-600 leading-relaxed space-y-3">
            <p>{t("howIntro")}</p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>{t("howStep1Title")}</strong>{" "}
                {t("howStep1Text")}
              </li>
              <li>
                <strong>{t("howStep2Title")}</strong>{" "}
                {t("howStep2Text")}
              </li>
              <li>
                <strong>{t("howStep3Title")}</strong>{" "}
                {t("howStep3Text")}
              </li>
            </ol>
            <p className="text-sm font-medium">
              {t("howPrivacy")}
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-3">{t("bundleTitle")}</h2>
          <p className="text-gray-600 leading-relaxed">
            {t("bundleText")}
          </p>
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
          <div id="kryptering" className="scroll-mt-20">
            <h2 className="text-xl font-bold mb-4">{t("cryptoTitle")}</h2>
            <div className="text-gray-600 text-sm leading-relaxed space-y-4">
              <p>{t("cryptoP1")}</p>
              <p>{t("cryptoP2")}</p>
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-3">
                <p className="font-semibold text-amber-800 mb-1">{t("cryptoQ")}</p>
                <p className="text-amber-700">{t("cryptoP3")}</p>
              </div>
              <p>{t("cryptoP4")}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
