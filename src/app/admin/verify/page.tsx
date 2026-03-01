"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function getDeviceId(): string {
  const key = "admin_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function VerifyPage() {
  const [status, setStatus] = useState<
    "loading" | "verifying" | "success" | "error" | "no-token"
  >("loading");
  const [message, setMessage] = useState("");
  const [nextQrUrl, setNextQrUrl] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setStatus("no-token");
      return;
    }

    setStatus("verifying");
    const deviceId = getDeviceId();

    fetch("/api/admin/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, deviceId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Verifikation fejlede");
          return;
        }
        setStatus("success");
        setMessage(data.message || "Godkendt!");
        if (data.nextQrUrl) {
          setNextQrUrl(data.nextQrUrl);
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Netværksfejl");
      });
  }, []);

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-8 text-center text-2xl font-bold">
        Admin Verifikation
      </h1>
      <Card>
        <div className="space-y-4 text-center py-4">
          {status === "loading" && (
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-melon-green border-t-transparent" />
          )}

          {status === "verifying" && (
            <>
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-melon-green border-t-transparent" />
              <p className="text-sm text-gray-500">Verificerer...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-melon-green/10">
                <svg
                  className="h-8 w-8 text-melon-green"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-melon-green">{message}</p>
              {nextQrUrl && (
                <p className="text-xs text-gray-400">
                  Gå tilbage til computerskærmen og scan den næste QR-kode.
                </p>
              )}
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-melon-red/10">
                <svg
                  className="h-8 w-8 text-melon-red"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-sm text-melon-red">{message}</p>
              <Button
                variant="outline"
                onClick={() => window.close()}
                className="mt-2"
              >
                Luk
              </Button>
            </>
          )}

          {status === "no-token" && (
            <p className="text-sm text-gray-500">
              Ingen token fundet. Scan en QR-kode fra admin-siden.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
