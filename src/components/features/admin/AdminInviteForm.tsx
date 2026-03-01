"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function AdminInviteForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    smsSent?: boolean;
  } | null>(null);

  async function invite() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
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
        smsSent: data.smsSent,
      });
      setName("");
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
          id="invite-name"
          label="Navn"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Adminens navn"
        />
        <Input
          id="invite-phone"
          label="Telefon (SMS)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+45..."
        />
        <Button
          onClick={invite}
          loading={loading}
          disabled={!phone.trim()}
          className="w-full"
        >
          Send invitation via SMS
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
          </div>
        )}
      </div>
    </Card>
  );
}
