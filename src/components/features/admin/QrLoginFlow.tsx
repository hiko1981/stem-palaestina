"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import QrCode from "@/components/ui/QrCode";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface QrLoginFlowProps {
  onAuthenticated: () => void;
}

type Step = 1 | 2 | 3 | "authenticated" | "failed";

const TTL_OPTIONS = [
  { label: "5 min", seconds: 5 * 60 },
  { label: "15 min", seconds: 15 * 60 },
  { label: "30 min", seconds: 30 * 60 },
];

export default function QrLoginFlow({ onAuthenticated }: QrLoginFlowProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ttl, setTtl] = useState(15 * 60); // default 15 min
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
      setStep(1);
    } catch {
      setError("Netværksfejl");
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for session updates
  useEffect(() => {
    if (!sessionId || doneRef.current) return;

    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/admin/auth/session?id=${sessionId}`
        );
        if (!res.ok) {
          stopPolling();
          setError("Session udløbet");
          return;
        }
        const data = await res.json();

        if (data.step !== step) {
          setStep(data.step);
          if (data.qrUrl) setQrUrl(data.qrUrl);
        }

        if (data.step === "authenticated" && data.jwt) {
          doneRef.current = true;
          stopPolling();
          // Set cookie with chosen TTL (PC only)
          await fetch("/api/admin/auth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jwt: data.jwt, maxAge: ttl }),
          });
          onAuthenticated();
        }

        if (data.step === "failed") {
          stopPolling();
          setError("Login fejlede. Prøv igen.");
        }
      } catch {
        // Network blip
      }
    }, 1500);

    return stopPolling;
  }, [sessionId, step, stopPolling, onAuthenticated]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  const stepLabels: Record<number, string> = {
    1: "Scan QR-koden med din telefon",
    2: "Scan QR #2 fra skærmen",
    3: "Scan QR #3 (sidste trin)",
  };

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
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-2 w-8 rounded-full transition-colors ${
                        typeof step === "number" && s <= step
                          ? "bg-melon-green"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Trin {typeof step === "number" ? step : "?"} af 3
                </p>
              </div>
              <QrCode value={qrUrl} size={220} />
              <p className="text-sm text-gray-500">
                {typeof step === "number"
                  ? stepLabels[step]
                  : "Vent venligst..."}
              </p>
              {step === 1 && (
                <div className="pt-2">
                  <p className="text-xs text-gray-400 mb-2">Session-varighed:</p>
                  <div className="flex justify-center gap-2">
                    {TTL_OPTIONS.map((opt) => (
                      <button
                        key={opt.seconds}
                        onClick={() => setTtl(opt.seconds)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          ttl === opt.seconds
                            ? "bg-melon-green text-white"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
