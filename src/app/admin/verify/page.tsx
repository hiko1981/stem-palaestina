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

type Status = "verifying" | "scanning" | "authenticated" | "error" | "no-token";

export default function VerifyPage() {
  const [status, setStatus] = useState<Status>("verifying");
  const [currentStep, setCurrentStep] = useState(1);
  const [message, setMessage] = useState("");
  const [stepFlash, setStepFlash] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);
  const lastScannedRef = useRef<string>("");
  const processingRef = useRef(false);
  const deviceIdRef = useRef<string>("");
  const scannerStartedRef = useRef(false);

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
    scannerStartedRef.current = false;
  }, []);

  // Start camera ONCE — never restarts between steps
  const startScanner = useCallback(async () => {
    if (scannerStartedRef.current) return;
    if (!scannerRef.current) return;

    scannerStartedRef.current = true;

    const { Html5Qrcode } = await import("html5-qrcode");
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
          if (processingRef.current) return;
          if (decodedText === lastScannedRef.current) return;

          let token: string | null = null;
          try {
            const url = new URL(decodedText);
            token = url.searchParams.get("token");
          } catch {
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
                // Brief green flash overlay — camera keeps running
                setStepFlash(true);
                setTimeout(() => {
                  setStepFlash(false);
                  lastScannedRef.current = "";
                  processingRef.current = false;
                }, 600);
              }
            } else {
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
      scannerStartedRef.current = false;
    }
  }, [stopScanner]);

  // Step 1: verify token from URL, then enter scanning mode
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
        const res = await fetch("/api/admin/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, deviceId: deviceIdRef.current }),
        });
        const data = await res.json();

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
  }, [stopScanner]);

  // Start camera once when entering scanning mode — never restarts
  useEffect(() => {
    if (status === "scanning") {
      startScanner();
    }
  }, [status, startScanner]);

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
                className={`h-2 w-8 rounded-full transition-all duration-300 ${
                  s <= stepsCompleted
                    ? "bg-melon-green"
                    : s === stepsCompleted + 1 && status === "scanning"
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

          {status === "scanning" && (
            <>
              <div className="relative mx-auto" style={{ width: 280, height: 280 }}>
                <div
                  id="qr-scanner"
                  ref={scannerRef}
                  className="overflow-hidden rounded-xl"
                  style={{ width: 280, height: 280 }}
                />
                {/* Green flash overlay — camera keeps running underneath */}
                {stepFlash && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-melon-green/20 animate-[fadeOut_0.6s_ease-out_forwards]">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
                      <svg className="h-8 w-8 text-melon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Ret kameraet mod skærmen
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
