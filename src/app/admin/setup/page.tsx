"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  getDeviceId,
  generateKeyPair,
} from "@/lib/admin-device-crypto";

export default function SetupPage() {
  const [status, setStatus] = useState<
    "loading" | "registering" | "success" | "error" | "no-token"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setStatus("no-token");
      return;
    }

    (async () => {
      setStatus("registering");
      const deviceId = getDeviceId();

      // Generate ECDSA keypair — private key stored non-extractable in IndexedDB
      let publicKey: string;
      try {
        publicKey = await generateKeyPair();
      } catch {
        setStatus("error");
        setMessage("Kunne ikke generere enhedsnøgle");
        return;
      }

      const ua = navigator.userAgent;
      let label = "Ukendt enhed";
      if (/iPhone/.test(ua)) label = "iPhone";
      else if (/iPad/.test(ua)) label = "iPad";
      else if (/Android/.test(ua)) label = "Android";
      else if (/Mac/.test(ua)) label = "Mac";
      else if (/Windows/.test(ua)) label = "Windows";

      try {
        const res = await fetch("/api/admin/auth/register-device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, deviceId, label, publicKey }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Registrering fejlede");
          return;
        }
        setStatus("success");
        setMessage("Enhed registreret! Du er nu logget ind.");
      } catch {
        setStatus("error");
        setMessage("Netværksfejl");
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-8 text-center text-2xl font-bold">
        Admin-adgang
      </h1>
      <Card>
        <div className="space-y-4 text-center py-4">
          {status === "loading" && (
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-melon-green border-t-transparent" />
          )}

          {status === "registering" && (
            <>
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-melon-green border-t-transparent" />
              <p className="text-sm text-gray-500">
                Registrerer din enhed...
              </p>
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
              <Button
                onClick={() => (window.location.href = "/admin")}
                className="w-full mt-2"
              >
                Gå til admin
              </Button>
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
            </>
          )}

          {status === "no-token" && (
            <p className="text-sm text-gray-500">
              Ugyldigt link. Bed en administrator om et nyt invitationslink.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
