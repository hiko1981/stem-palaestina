"use client";

import { useState, useRef } from "react";
import Button from "@/components/ui/Button";

interface Props {
  candidateId: number;
  sig: string;
}

export default function PhotoUploadForm({ candidateId, sig }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vælg venligst et billede (JPG, PNG)");
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setError("Billedet er for stort (max 1.5 MB)");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    if (!preview) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/candidate/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, sig, photo: preview }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Noget gik galt");
        return;
      }
      setDone(true);
    } catch {
      setError("Netværksfejl — prøv igen");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-3">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-melon-green/10">
          <svg className="h-8 w-8 text-melon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold">Billede uploadet!</h2>
        <p className="text-sm text-gray-600">
          Tak! Dit billede bliver gennemgået og lagt op hurtigst muligt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-melon-green transition-colors"
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="h-32 w-32 rounded-full object-cover mx-auto ring-2 ring-melon-green"
          />
        ) : (
          <>
            <svg className="h-10 w-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <p className="text-sm text-gray-500">Tryk for at vælge et billede</p>
            <p className="text-xs text-gray-400 mt-1">JPG eller PNG, max 1.5 MB</p>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview && (
        <div className="flex gap-2">
          <Button onClick={handleUpload} loading={loading} className="flex-1">
            Upload billede
          </Button>
          <Button
            variant="outline"
            onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
          >
            Skift
          </Button>
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-melon-red">{error}</p>
      )}
    </div>
  );
}
