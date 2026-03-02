import { prisma } from "@/lib/prisma";
import { verifyOptout } from "@/lib/optout-sig";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import PhotoUploadForm from "./PhotoUploadForm";

interface Props {
  searchParams: Promise<{ cid?: string; sig?: string }>;
}

export default async function KandidatFotoPage({ searchParams }: Props) {
  const t = await getTranslations("photoUpload");
  const to = await getTranslations("optout");
  const params = await searchParams;
  const cidStr = params.cid;
  const sig = params.sig;

  if (!cidStr || !sig) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2">{to("invalidLink")}</h1>
          <p className="text-gray-600 text-sm">
            {to("linkVerifyFailed")}
          </p>
        </div>
      </div>
    );
  }

  const candidateId = parseInt(cidStr, 10);
  if (isNaN(candidateId) || !verifyOptout(candidateId, sig)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2">{to("invalidLink")}</h1>
          <p className="text-gray-600 text-sm">
            {to("linkVerifyFailed")}
          </p>
        </div>
      </div>
    );
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, name: true, photoUrl: true },
  });

  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2">{to("candidateNotFound")}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">{t("title")}</h1>
          <p className="text-gray-600 text-sm">
            {t("greeting", { name: candidate.name })}
          </p>
        </div>

        {candidate.photoUrl && (
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">{t("currentImage")}</p>
            <img
              src={candidate.photoUrl}
              alt={candidate.name}
              className="h-24 w-24 rounded-full object-cover ring-2 ring-gray-200 mx-auto"
            />
          </div>
        )}

        <PhotoUploadForm candidateId={candidateId} sig={sig} />
      </div>
    </div>
  );
}
