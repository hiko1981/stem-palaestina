"use client";

import { useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Turnstile from "@/components/features/Turnstile";

type Step = "phone" | "code" | "confirm" | "done" | "already";

export default function PhoneVerifyForm() {
  const [step, setStep] = useState<Step>(() => {
    if (typeof window !== "undefined" && localStorage.getItem("stem_palaestina_voted")) {
      return "already";
    }
    return "phone";
  });

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const handleTurnstile = useCallback((t: string) => {
    setTurnstileToken(t);
  }, []);

  async function requestCode() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/verify/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setStep("code");
    } catch {
      setError("Netværksfejl. Prøv igen.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmCode() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }
        return;
      }
      setToken(data.token);
      setStep("confirm");
    } catch {
      setError("Netværksfejl. Prøv igen.");
    } finally {
      setLoading(false);
    }
  }

  async function castVote() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      localStorage.setItem("stem_palaestina_voted", "true");
      setStep("done");
    } catch {
      setError("Netværksfejl. Prøv igen.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "already") {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-palestine-green/10 mb-4">
          <svg className="h-8 w-8 text-palestine-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Du har allerede stemt</h2>
        <p className="text-gray-600">
          Tak for din støtte til Palæstina. Del siden med andre.
        </p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-palestine-green/10 mb-4">
          <svg className="h-8 w-8 text-palestine-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Tak for din stemme!</h2>
        <p className="text-gray-600">
          Din anonyme stemme er registreret. Sammen gør vi en forskel.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <span className={step === "phone" ? "text-palestine-green font-semibold" : ""}>
          Telefon
        </span>
        <span>&rarr;</span>
        <span className={step === "code" ? "text-palestine-green font-semibold" : ""}>
          Kode
        </span>
        <span>&rarr;</span>
        <span className={step === "confirm" ? "text-palestine-green font-semibold" : ""}>
          Bekræft
        </span>
      </div>

      {step === "phone" && (
        <div className="space-y-4">
          <Input
            id="phone"
            label="Mobilnummer"
            type="tel"
            placeholder="+45 12345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Turnstile onVerify={handleTurnstile} />
          <Button
            onClick={requestCode}
            loading={loading}
            disabled={!phone || !turnstileToken}
            className="w-full"
          >
            Send kode
          </Button>
        </div>
      )}

      {step === "code" && (
        <div className="space-y-4">
          <p className="text-center text-sm text-gray-600">
            Vi har sendt en 6-cifret kode til <strong>{phone}</strong>
          </p>
          <Input
            id="code"
            label="Verifikationskode"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          {attemptsLeft !== null && attemptsLeft > 0 && (
            <p className="text-sm text-gray-500 text-center">
              {attemptsLeft} forsøg tilbage
            </p>
          )}
          <Button
            onClick={confirmCode}
            loading={loading}
            disabled={code.length !== 6}
            className="w-full"
          >
            Bekræft kode
          </Button>
          <button
            onClick={() => {
              setStep("phone");
              setCode("");
              setError("");
              setAttemptsLeft(null);
            }}
            className="block w-full text-center text-sm text-gray-500 hover:text-palestine-green"
          >
            Tilbage
          </button>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4 text-center">
          <p className="text-gray-700">
            Du er verificeret. Ved at stemme støtter du de tre krav:
          </p>
          <ul className="text-left text-sm text-gray-600 space-y-1">
            <li>1. Anerkend Palæstina</li>
            <li>2. Stop våbensalg til Israel</li>
            <li>3. Stop ulovlige investeringer</li>
          </ul>
          <Button onClick={castVote} loading={loading} className="w-full">
            Afgiv min stemme
          </Button>
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-palestine-red">{error}</p>
      )}
    </div>
  );
}
