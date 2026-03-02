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
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  // Re-render when locale changes
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

  async function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);

    try {
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], "vote-palestine-profile.png", {
        type: "image/png",
      });

      // Mobile: native share sheet (Save to Photos / share to apps)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Vote Palestine",
        });
        return;
      }

      // Desktop fallback: trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vote-palestine-profile.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // User cancelled share — that's fine
    } finally {
      setSaving(false);
    }
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
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 px-6 py-20 cursor-pointer active:bg-melon-green/5 active:border-melon-green transition-colors"
        >
          <svg
            className="h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
            />
          </svg>
          <span className="text-sm font-semibold text-gray-600">
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

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // ── Preview state ──
  return (
    <div className="space-y-5">
      {/* Preview with subtle shadow */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-lg">
        <img
          src={previewUrl}
          alt="Profile frame preview"
          className="h-full w-full object-contain"
        />
      </div>

      {/* Single primary action */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-melon-green py-4 text-base font-bold text-white active:bg-melon-green-dark transition-colors disabled:opacity-60"
      >
        {saving ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </span>
        ) : (
          t("download")
        )}
      </button>

      {/* Change image */}
      <label
        htmlFor="frame-upload-change"
        className="block text-center text-sm text-gray-400 font-medium cursor-pointer active:text-gray-600"
      >
        {t("changeImage")}
      </label>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        className="hidden"
        id="frame-upload-change"
      />

      <p className="text-center text-xs text-gray-400">{t("privacyNote")}</p>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
