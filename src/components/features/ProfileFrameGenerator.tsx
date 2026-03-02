"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { renderFrame, canvasToBlob } from "@/lib/frame-renderer";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function ProfileFrameGenerator() {
  const t = useTranslations("profileFrame");
  const locale = useLocale();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const processImage = useCallback(
    (file: File) => {
      setError("");
      if (file.size > MAX_FILE_SIZE) {
        setError(t("imageTooLarge"));
        return;
      }

      const url = URL.createObjectURL(file);
      setImageSrc(url);

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        renderFrame(canvas, img, t("stampText"), locale);

        // Generate preview blob URL
        canvas.toBlob((blob) => {
          if (blob) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(blob));
          }
        }, "image/png");
      };
      img.src = url;
    },
    [locale, t, previewUrl],
  );

  // Re-render when locale changes (stampText changes)
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      renderFrame(canvas, img, t("stampText"), locale);
      canvas.toBlob((blob) => {
        if (blob) {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setPreviewUrl(URL.createObjectURL(blob));
        }
      }, "image/png");
    };
    img.src = imageSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, t]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  }

  async function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vote-palestine-profile.png";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], "vote-palestine-profile.png", {
      type: "image/png",
    });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Vote Palestine",
          text: "vote-palestine.com",
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to download
      }
    }
    // Fallback: trigger download
    handleDownload();
  }

  function handleStartOver() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc(null);
    setPreviewUrl(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Upload state ──
  if (!previewUrl) {
    return (
      <div className="space-y-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="hidden"
          id="frame-upload"
        />
        <label
          htmlFor="frame-upload"
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-16 cursor-pointer hover:border-melon-green hover:bg-melon-green/5 transition-colors"
        >
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
              d="M12 16v-8m0 0l-3 3m3-3l3 3M6.75 21A3.75 3.75 0 013 17.25V6.75A3.75 3.75 0 016.75 3h10.5A3.75 3.75 0 0121 6.75v10.5A3.75 3.75 0 0117.25 21H6.75z"
            />
          </svg>
          <span className="text-sm font-semibold text-gray-700">
            {t("uploadLabel")}
          </span>
          <span className="text-xs text-gray-400">{t("uploadHint")}</span>
        </label>

        {error && (
          <p className="text-center text-sm text-melon-red">{error}</p>
        )}

        <p className="text-center text-xs text-gray-400">
          {t("privacyNote")}
        </p>

        {/* Hidden canvas for rendering */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // ── Preview state ──
  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        <img
          src={previewUrl}
          alt="Profile frame preview"
          className="h-full w-full object-contain"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="flex-1 rounded-lg bg-melon-green py-3 text-sm font-bold text-white hover:bg-melon-green-dark transition-colors"
        >
          {t("download")}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 rounded-lg border border-melon-green py-3 text-sm font-bold text-melon-green hover:bg-melon-green/5 transition-colors"
        >
          {t("share")}
        </button>
      </div>

      {/* Change image / Start over */}
      <div className="flex justify-center gap-4">
        <label
          htmlFor="frame-upload-change"
          className="text-sm text-melon-green font-medium cursor-pointer hover:underline"
        >
          {t("changeImage")}
        </label>
        <button
          onClick={handleStartOver}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          {t("startOver")}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        className="hidden"
        id="frame-upload-change"
      />

      <p className="text-center text-xs text-gray-400">{t("privacyNote")}</p>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
