"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

interface LangMissRecord {
  language: string;
  count: number;
  lastSeen: string;
}

interface VoteRecord {
  id: number;
  phoneHash: string;
  voteValue: boolean;
  votedAt: string;
}

interface CandidateRecord {
  id: number;
  name: string;
  party: string;
  constituency: string;
  phoneHash: string | null;
  verified: boolean;
  createdAt: string;
}

interface SupportRecord {
  id: number;
  category: string;
  message: string;
  deviceId: string | null;
  createdAt: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportRecord[]>([]);
  const [langMisses, setLangMisses] = useState<LangMissRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function login() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/votes", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (!res.ok) {
        setError("Forkert adgangskode");
        return;
      }
      const data = await res.json();
      setVotes(data.votes);
      setCandidates(data.candidates || []);
      setSupportMessages(data.supportMessages || []);
      setAuthed(true);
      // Fetch language misses
      fetch("/api/admin/lang-miss", {
        headers: { Authorization: `Bearer ${password}` },
      })
        .then((r) => r.json())
        .then((d) => setLangMisses(d.misses || []))
        .catch(() => {});
    } catch {
      setError("Netværksfejl");
    } finally {
      setLoading(false);
    }
  }

  async function fetchData() {
    const res = await fetch("/api/admin/votes", {
      headers: { Authorization: `Bearer ${password}` },
    });
    if (res.ok) {
      const data = await res.json();
      setVotes(data.votes);
      setCandidates(data.candidates || []);
      setSupportMessages(data.supportMessages || []);
    }
    fetch("/api/admin/lang-miss", {
      headers: { Authorization: `Bearer ${password}` },
    })
      .then((r) => r.json())
      .then((d) => setLangMisses(d.misses || []))
      .catch(() => {});
  }

  async function deleteVote(phoneHash: string) {
    setMessage("");
    if (!confirm("Er du sikker på, at du vil slette denne stemme?")) return;
    const res = await fetch("/api/admin/votes", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${password}`,
      },
      body: JSON.stringify({ phoneHash }),
    });
    if (res.ok) {
      setMessage("Stemme slettet");
      await fetchData();
    }
  }

  async function deleteAll() {
    setMessage("");
    if (!confirm("Er du sikker? ALLE stemmer slettes permanent.")) return;
    const typed = prompt("Skriv SLET ALLE for at bekræfte:");
    if (typed !== "SLET ALLE") {
      setMessage("Sletning annulleret.");
      return;
    }
    const res = await fetch("/api/admin/votes", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${password}`,
      },
      body: JSON.stringify({ all: true }),
    });
    if (res.ok) {
      setMessage("Alle stemmer slettet");
      await fetchData();
    }
  }

  async function verifyCandidate(id: number, verified: boolean) {
    setMessage("");
    const res = await fetch("/api/admin/votes", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${password}`,
      },
      body: JSON.stringify({ candidateId: id, verified }),
    });
    if (res.ok) {
      setMessage(verified ? "Kandidat godkendt" : "Kandidat afvist");
      await fetchData();
    }
  }

  async function deleteCandidate(id: number) {
    setMessage("");
    if (!confirm("Er du sikker på, at du vil slette denne kandidat?")) return;
    const res = await fetch("/api/admin/votes", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${password}`,
      },
      body: JSON.stringify({ deleteCandidateId: id }),
    });
    if (res.ok) {
      setMessage("Kandidat slettet");
      await fetchData();
    }
  }

  async function deleteSupportMessage(id: number) {
    setMessage("");
    if (!confirm("Slet denne supportbesked?")) return;
    const res = await fetch("/api/admin/votes", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${password}`,
      },
      body: JSON.stringify({ deleteSupportId: id }),
    });
    if (res.ok) {
      setMessage("Supportbesked slettet");
      await fetchData();
    }
  }

  function maskHash(hash: string) {
    return hash.slice(0, 8) + "...";
  }

  // Find vote for a candidate by phoneHash
  function getCandidateVote(phoneHash: string | null): VoteRecord | undefined {
    if (!phoneHash) return undefined;
    return votes.find((v) => v.phoneHash === phoneHash);
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="mb-8 text-center text-2xl font-bold">Admin</h1>
        <Card>
          <div className="space-y-4">
            <Input
              id="admin-pw"
              label="Adgangskode"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
            />
            <Button onClick={login} loading={loading} className="w-full">
              Log ind
            </Button>
            {error && (
              <p className="text-center text-sm text-melon-red">{error}</p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Only show candidates who have claimed their profile (phoneHash set = voted + verified phone)
  // Seeded candidates without phoneHash are just directory entries, not applications
  const claimed = candidates.filter((c) => c.phoneHash);
  const pendingCandidates = claimed.filter((c) => !c.verified);
  const verifiedCandidates = claimed.filter((c) => c.verified);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 space-y-12">
      {message && (
        <p className="text-center text-sm text-melon-green font-medium">
          {message}
        </p>
      )}

      {/* Kandidat-ansøgninger */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            Kandidat-ansøgninger
            {pendingCandidates.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-melon-red/10 px-2.5 py-0.5 text-xs font-medium text-melon-red">
                {pendingCandidates.length} nye
              </span>
            )}
          </h2>
          <Button variant="outline" onClick={fetchData}>
            Opdater
          </Button>
        </div>

        {pendingCandidates.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500 text-sm">Ingen ventende ansøgninger.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingCandidates.map((c) => {
              const vote = getCandidateVote(c.phoneHash);
              return (
                <Card key={c.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold">{c.name}</h3>
                      <p className="text-sm text-gray-500">
                        {c.party} &middot; {c.constituency}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(c.createdAt).toLocaleString("da-DK")}
                        {c.phoneHash && ` \u00b7 ${maskHash(c.phoneHash)}`}
                      </p>
                      {vote && (
                        <p className="mt-1">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              vote.voteValue
                                ? "bg-melon-green/10 text-melon-green"
                                : "bg-melon-red/10 text-melon-red"
                            }`}
                          >
                            Stemte: {vote.voteValue ? "Ja" : "Nej"}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        onClick={() => verifyCandidate(c.id, true)}
                        className="text-xs px-3 py-2 min-h-[44px]"
                      >
                        Godkend
                      </Button>
                      <button
                        onClick={() => deleteCandidate(c.id)}
                        className="text-xs text-melon-red hover:underline px-3 py-2 min-h-[44px]"
                      >
                        Slet
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {verifiedCandidates.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Godkendte kandidater ({verifiedCandidates.length})
            </h3>
            <div className="space-y-2">
              {verifiedCandidates.map((c) => {
                const vote = getCandidateVote(c.phoneHash);
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-gray-500">
                        {c.party} &middot; {c.constituency}
                        {vote && (
                          <span className={`ml-2 ${vote.voteValue ? "text-melon-green" : "text-melon-red"}`}>
                            ({vote.voteValue ? "Ja" : "Nej"})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => verifyCandidate(c.id, false)}
                        className="text-xs text-gray-400 hover:underline px-2 py-2 min-h-[44px]"
                      >
                        Fjern godkendelse
                      </button>
                      <button
                        onClick={() => deleteCandidate(c.id)}
                        className="text-xs text-melon-red hover:underline px-2 py-2 min-h-[44px]"
                      >
                        Slet
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Supportbeskeder */}
      <section>
        <h2 className="text-xl font-bold mb-4">
          Supportbeskeder
          {supportMessages.length > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              {supportMessages.length}
            </span>
          )}
        </h2>
        {supportMessages.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500 text-sm">Ingen supportbeskeder.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {supportMessages.map((s) => (
              <Card key={s.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 mb-1">
                      {s.category}
                    </span>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {s.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(s.createdAt).toLocaleString("da-DK")}
                      {s.deviceId && ` · ${s.deviceId.slice(0, 8)}...`}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteSupportMessage(s.id)}
                    className="text-xs text-melon-red hover:underline shrink-0 px-2 py-2 min-h-[44px]"
                  >
                    Slet
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Sprogbehov */}
      {langMisses.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Sprogbehov</h2>
          <p className="text-sm text-gray-500 mb-3">
            Sprog som brugere har, men vi ikke understøtter endnu.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">Sprog</th>
                  <th className="pb-2 pr-4">Antal</th>
                  <th className="pb-2">Sidst set</th>
                </tr>
              </thead>
              <tbody>
                {langMisses.map((m) => (
                  <tr key={m.language} className="border-b">
                    <td className="py-2 pr-4 font-mono font-medium">{m.language}</td>
                    <td className="py-2 pr-4">{m.count}</td>
                    <td className="py-2 text-gray-500">
                      {new Date(m.lastSeen).toLocaleString("da-DK")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Stemmer */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Stemmer</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={deleteAll}>
              Slet alle
            </Button>
          </div>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          {votes.length} stemme{votes.length !== 1 ? "r" : ""} i alt
        </p>

        {votes.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">Ingen stemmer endnu.</p>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">ID</th>
                  <th className="pb-2 pr-4">Phone Hash</th>
                  <th className="pb-2 pr-4">Stemme</th>
                  <th className="pb-2 pr-4">Tidspunkt</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {votes.map((v) => (
                  <tr key={v.id} className="border-b">
                    <td className="py-2 pr-4 text-gray-400">{v.id}</td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      {maskHash(v.phoneHash)}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          v.voteValue
                            ? "bg-melon-green/10 text-melon-green"
                            : "bg-melon-red/10 text-melon-red"
                        }`}
                      >
                        {v.voteValue ? "Ja" : "Nej"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">
                      {new Date(v.votedAt).toLocaleString("da-DK")}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => deleteVote(v.phoneHash)}
                        className="text-xs text-melon-red hover:underline px-2 py-2 min-h-[44px]"
                      >
                        Slet
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
