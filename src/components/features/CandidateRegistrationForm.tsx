"use client";

import { useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CountryCodeSelect from "@/components/features/CountryCodeSelect";

export default function CandidateRegistrationForm() {
  const [name, setName] = useState("");
  const [party, setParty] = useState("");
  const [constituency, setConstituency] = useState("");
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("+45");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleDialCode = useCallback((code: string) => {
    setDialCode(code);
  }, []);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/candidate/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, party, constituency, phone, dialCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Netværksfejl. Prøv igen.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-melon-green/10 mb-2">
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
        <h2 className="text-xl font-bold">Registrering modtaget!</h2>
        <p className="text-gray-600">
          Vi verificerer dine oplysninger snarest muligt. Du vil modtage en SMS
          når din profil er godkendt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        id="name"
        label="Fulde navn"
        placeholder="Dit fulde navn"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        id="party"
        label="Parti"
        placeholder="Partinavn"
        value={party}
        onChange={(e) => setParty(e.target.value)}
      />
      <Input
        id="constituency"
        label="Valgkreds"
        placeholder="Din valgkreds"
        value={constituency}
        onChange={(e) => setConstituency(e.target.value)}
      />
      <div className="flex gap-2">
        <CountryCodeSelect value={dialCode} onChange={handleDialCode} />
        <div className="flex-1">
          <Input
            id="candidate-phone"
            label="Telefonnummer"
            type="tel"
            placeholder="12345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>
      <Button
        onClick={handleSubmit}
        loading={loading}
        disabled={!name || !party || !constituency || !phone}
        className="w-full"
      >
        Registrer som kandidat
      </Button>
      {error && (
        <p className="text-center text-sm text-melon-red">{error}</p>
      )}
    </div>
  );
}
