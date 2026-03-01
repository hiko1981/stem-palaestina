"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Card from "@/components/ui/Card";

function getDeviceId(): string {
  const key = "admin_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

type Status =
  | "verifying"
  | "scanning"
  | "step-done"
  | "authenticated"
  | "error"
  | "no-token";

export default function VerifyPage() {
  const [status, setStatus] = useState<Status>("verifying");
  const [currentStep, setCurrentStep] = useState(1);
  const [message, setMessage] = useState("");
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);
  const lastScannedRef = useRef<string>("");
  const processingRef = useRef(false);
  const deviceIdRef = useRef<string>("");

  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scanner = html5QrRef.current as any;
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch {
        // ignore
      }
      html5QrRef.current = null;
    }
  }, []);

  const verifyToken = useCallback(
    async (token: string): Promise<{ ok: boolean; step?: number | string; message?: string; error?: string }> => {
      const res = await fetch("/api/admin/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, deviceId: deviceIdRef.current }),
      });
      return res.json();
    },
    []
  );

  const startScanner = useCallback(async (forStep: number) => {
    if (!scannerRef.current) return;

    // Dynamic import to avoid SSR issues
    const { Html5Qrcode } = await import("html5-qrcode");

    await stopScanner();

    const scanner = new Html5Qrcode("qr-scanner");
    html5QrRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 5,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText: string) => {
          // Prevent double-processing
          if (processingRef.current) return;
          if (decodedText === lastScannedRef.current) return;

          // Extract token from URL
          let token: string | null = null;
          try {
            const url = new URL(decodedText);
            token = url.searchParams.get("token");
          } catch {
            // Not a valid URL — ignore
            return;
          }

          if (!token) return;

          processingRef.current = true;
          lastScannedRef.current = decodedText;

          try {
            const data = await fetch("/api/admin/auth/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, deviceId: deviceIdRef.current }),
            }).then((r) => r.json());

            if (data.ok) {
              if (data.step === "authenticated") {
                await stopScanner();
                setCurrentStep(4);
                setStatus("authenticated");
                setMessage("Login godkendt! Computeren logger ind nu.");
              } else if (typeof data.step === "number") {
                setCurrentStep(data.step);
                setStatus("step-done");
                setMessage(data.message || `Trin ${data.step - 1} godkendt`);
                // Brief pause to show checkmark, then resume scanning
                setTimeout(() => {
                  lastScannedRef.current = "";
                  processingRef.current = false;
                  setStatus("scanning");
                }, 800);
              }
            } else {
              // Token already used or wrong step — keep scanning
              processingRef.current = false;
            }
          } catch {
            processingRef.current = false;
          }
        },
        () => {
          // QR not found in frame — ignore
        }
      );
    } catch {
      setStatus("error");
      setMessage("Kunne ikke åbne kamera. Tillad kameraadgang og prøv igen.");
    }
  }, [stopScanner]);

  // Initial token verification (step 1 from URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setStatus("no-token");
      return;
    }

    deviceIdRef.current = getDeviceId();

    (async () => {
      try {
        const data = await verifyToken(token);
        if (!data.ok) {
          setStatus("error");
          setMessage(data.error || "Verifikation fejlede");
          return;
        }

        if (data.step === "authenticated") {
          setCurrentStep(4);
          setStatus("authenticated");
          setMessage("Login godkendt! Computeren logger ind nu.");
          return;
        }

        // Step 1 done, need to scan QR #2 and #3
        setCurrentStep(typeof data.step === "number" ? data.step : 2);
        setStatus("scanning");
      } catch {
        setStatus("error");
        setMessage("Netværksfejl");
      }
    })();

    return () => {
      stopScanner();
    };
  }, [verifyToken, stopScanner]);

  // Start camera when entering scanning mode
  useEffect(() => {
    if (status === "scanning") {
      startScanner(currentStep);
    }
  }, [status, currentStep, startScanner]);

  const stepsCompleted = currentStep - 1;

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold">Admin Login</h1>

      {/* Progress bar */}
      {status !== "no-token" && status !== "error" && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-8 rounded-full transition-colors ${
                  s <= stepsCompleted
                    ? "bg-melon-green"
                    : s === stepsCompleted + 1 &&
                        (status === "scanning" || status === "verifying")
                      ? "bg-melon-green/40 animate-pulse"
                      : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-center text-gray-400">
            Trin {Math.min(stepsCompleted + 1, 3)} af 3
          </p>
        </div>
      )}

      <Card>
        <div className="space-y-4 text-center py-2">
          {status === "verifying" && (
            <>
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-melon-green border-t-transparent" />
              <p className="text-sm text-gray-500">Verificerer...</p>
            </>
          )}

          {(status === "scanning" || status === "step-done") && (
            <>
              {status === "step-done" && (
                <div className="flex items-center justify-center gap-2 text-melon-green">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{message}</span>
                </div>
              )}
              <div
                id="qr-scanner"
                ref={scannerRef}
                className="mx-auto overflow-hidden rounded-xl"
                style={{ width: 280, height: 280 }}
              />
              <p className="text-sm text-gray-500">
                {currentStep <= 3
                  ? `Ret kameraet mod QR #${currentStep} på skærmen`
                  : "Vent venligst..."}
              </p>
            </>
          )}

          {status === "authenticated" && (
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
              <p className="text-xs text-gray-400">
                Du kan lukke dette vindue.
              </p>
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
              Ingen token fundet. Scan en QR-kode fra admin-siden.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
