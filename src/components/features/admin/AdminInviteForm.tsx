"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function AdminInviteForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    setupUrl?: string;
  } | null>(null);

  async function invite() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          phone: phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error || "Fejl" });
        return;
      }
      setResult({
        ok: true,
        message: data.message,
        setupUrl: data.setupUrl,
      });
      setEmail("");
      setPhone("");
    } catch {
      setResult({ ok: false, message: "Netværksfejl" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="font-bold mb-4">Inviter ny admin</h3>
      <div className="space-y-3">
        <Input
          id="invite-email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
        />
        <Input
          id="invite-phone"
          label="Telefon (valgfrit)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+45..."
        />
        <Button
          onClick={invite}
          loading={loading}
          disabled={!email && !phone}
          className="w-full"
        >
          Send invitation
        </Button>
        {result && (
          <div
            className={`text-sm p-3 rounded-lg ${
              result.ok
                ? "bg-melon-green/10 text-melon-green"
                : "bg-melon-red/10 text-melon-red"
            }`}
          >
            <p>{result.message}</p>
            {result.setupUrl && (
              <p className="mt-2 font-mono text-xs break-all">
                {result.setupUrl}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
