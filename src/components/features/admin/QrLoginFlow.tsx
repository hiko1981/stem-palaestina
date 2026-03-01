"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import QrCode from "@/components/ui/QrCode";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface QrLoginFlowProps {
  onAuthenticated: () => void;
}

export default function QrLoginFlow({ onAuthenticated }: QrLoginFlowProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startSession = useCallback(async () => {
    setError("");
    setLoading(true);
    doneRef.current = false;
    try {
      const res = await fetch("/api/admin/auth/session", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Kunne ikke starte session");
        return;
      }
      const data = await res.json();
      setSessionId(data.sessionId);
      setQrUrl(data.qrUrl);
    } catch {
      setError("Netværksfejl");
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for authentication
  useEffect(() => {
    if (!sessionId || doneRef.current) return;

    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/auth/session?id=${sessionId}`);
        if (!res.ok) {
          stopPolling();
          setError("Session udløbet");
          return;
        }
        const data = await res.json();

        if (data.status === "authenticated" && data.jwt) {
          doneRef.current = true;
          stopPolling();
          await fetch("/api/admin/auth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jwt: data.jwt }),
          });
          onAuthenticated();
        }

        if (data.status === "failed") {
          stopPolling();
          setError("Login fejlede. Prøv igen.");
        }
      } catch {
        // Network blip, keep polling
      }
    }, 1500);

    return stopPolling;
  }, [sessionId, stopPolling, onAuthenticated]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-8 text-center text-2xl font-bold">Admin Login</h1>
      <Card>
        <div className="space-y-6 text-center">
          {error ? (
            <>
              <p className="text-sm text-melon-red">{error}</p>
              <Button onClick={startSession} loading={loading}>
                Prøv igen
              </Button>
            </>
          ) : qrUrl ? (
            <>
              <QrCode value={qrUrl} size={220} />
              <p className="text-sm text-gray-500">
                Scan QR-koden med din telefon
              </p>
            </>
          ) : (
            <div className="py-8">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-melon-green border-t-transparent" />
              <p className="mt-4 text-sm text-gray-500">Opretter session...</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
