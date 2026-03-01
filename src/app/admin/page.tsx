"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import ChevronIcon from "@/components/ui/ChevronIcon";

interface HitDay {
  date: string;
  count: number;
}

interface HitStats {
  days: HitDay[];
  total: number;
  today: number;
}

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
  contactEmail: string | null;
  contactPhone: string | null;
  publicStatement: string | null;
  photoUrl: string | null;
  pledged: boolean;
  optedOut: boolean;
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
  const [hitStats, setHitStats] = useState<HitStats | null>(null);
  const [expandedCandidate, setExpandedCandidate] = useState<number | null>(null);
  const [votesOpen, setVotesOpen] = useState(false);
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
      // Fetch language misses + hit stats
      fetch("/api/admin/lang-miss", {
        headers: { Authorization: `Bearer ${password}` },
      })
        .then((r) => r.json())
        .then((d) => setLangMisses(d.misses || []))
        .catch(() => {});
      fetch("/api/admin/hits", {
        headers: { Authorization: `Bearer ${password}` },
      })
        .then((r) => r.json())
        .then((d) => setHitStats(d))
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
    fetch("/api/admin/hits", {
      headers: { Authorization: `Bearer ${password}` },
    })
      .then((r) => r.json())
      .then((d) => setHitStats(d))
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

      {/* Sidevisninger */}
      {hitStats && (
        <section>
          <h2 className="text-xl font-bold mb-4">Sidevisninger</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card>
              <p className="text-xs text-gray-500">I alt</p>
              <p className="text-2xl font-bold tabular-nums">{hitStats.total.toLocaleString("da-DK")}</p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500">I dag</p>
              <p className="text-2xl font-bold tabular-nums">{hitStats.today.toLocaleString("da-DK")}</p>
            </Card>
          </div>
          {hitStats.days.length > 0 && (() => {
            const last7 = hitStats.days.slice(-7);
            const max = Math.max(...last7.map((d) => d.count), 1);
            return (
              <div className="flex items-end gap-1 h-20">
                {last7.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-melon-green/70 rounded-t"
                      style={{ height: `${(d.count / max) * 100}%`, minHeight: 2 }}
                    />
                    <span className="text-[10px] text-gray-400">{d.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>
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
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt={c.name} className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-gray-200" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400">
                          {c.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold">{c.name}</h3>
                        <p className="text-sm text-gray-500">
                          {c.party} &middot; {c.constituency}
                        </p>
                      </div>
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
                  {/* Contact info */}
                  {(c.contactPhone || c.contactEmail) && (
                    <div className="rounded-md bg-gray-50 px-3 py-2 mb-3 space-y-1">
                      {c.contactPhone && (
                        <p className="text-sm">
                          <span className="text-gray-400 mr-1">Tlf:</span>
                          <a href={`tel:${c.contactPhone}`} className="text-melon-green hover:underline">{c.contactPhone}</a>
                        </p>
                      )}
                      {c.contactEmail && (
                        <p className="text-sm">
                          <span className="text-gray-400 mr-1">Email:</span>
                          <a href={`mailto:${c.contactEmail}`} className="text-melon-green hover:underline">{c.contactEmail}</a>
                        </p>
                      )}
                    </div>
                  )}
                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span>{new Date(c.createdAt).toLocaleString("da-DK")}</span>
                    {c.phoneHash && <span>&middot; {maskHash(c.phoneHash)}</span>}
                    {vote && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                          vote.voteValue
                            ? "bg-melon-green/10 text-melon-green"
                            : "bg-melon-red/10 text-melon-red"
                        }`}
                      >
                        Stemte: {vote.voteValue ? "Ja" : "Nej"}
                      </span>
                    )}
                    {c.pledged && (
                      <span className="inline-flex items-center rounded-full bg-melon-green/10 text-melon-green px-2 py-0.5 font-medium">
                        Tilsluttet
                      </span>
                    )}
                  </div>
                  {/* Public statement */}
                  {c.publicStatement && (
                    <p className="mt-2 text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">
                      {c.publicStatement}
                    </p>
                  )}
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
                const isExpanded = expandedCandidate === c.id;
                return (
                  <div key={c.id} className="rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setExpandedCandidate(isExpanded ? null : c.id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {c.photoUrl ? (
                          <img src={c.photoUrl} alt={c.name} className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-gray-200" />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400">
                            {c.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-gray-500">
                          {c.party} &middot; {c.constituency}
                          {vote && (
                            <span className={`ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${vote.voteValue ? "bg-melon-green/10 text-melon-green" : "bg-melon-red/10 text-melon-red"}`}>
                              {vote.voteValue ? "Ja" : "Nej"}
                            </span>
                          )}
                        </p>
                        </div>
                      </div>
                      <ChevronIcon open={isExpanded} />
                    </button>
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50/50">
                        {/* Contact info */}
                        {(c.contactPhone || c.contactEmail) && (
                          <div className="space-y-1">
                            {c.contactPhone && (
                              <p className="text-sm">
                                <span className="text-gray-400 mr-1">Tlf:</span>
                                <a href={`tel:${c.contactPhone}`} className="text-melon-green hover:underline">{c.contactPhone}</a>
                              </p>
                            )}
                            {c.contactEmail && (
                              <p className="text-sm">
                                <span className="text-gray-400 mr-1">Email:</span>
                                <a href={`mailto:${c.contactEmail}`} className="text-melon-green hover:underline">{c.contactEmail}</a>
                              </p>
                            )}
                          </div>
                        )}
                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                          <span>{new Date(c.createdAt).toLocaleString("da-DK")}</span>
                          {c.phoneHash && <span>&middot; {maskHash(c.phoneHash)}</span>}
                          {c.pledged && (
                            <span className="inline-flex items-center rounded-full bg-melon-green/10 text-melon-green px-2 py-0.5 font-medium">
                              Tilsluttet
                            </span>
                          )}
                        </div>
                        {/* Public statement */}
                        {c.publicStatement && (
                          <p className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">
                            {c.publicStatement}
                          </p>
                        )}
                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); verifyCandidate(c.id, false); }}
                            className="text-xs text-gray-400 hover:underline px-2 py-2 min-h-[44px]"
                          >
                            Fjern godkendelse
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteCandidate(c.id); }}
                            className="text-xs text-melon-red hover:underline px-2 py-2 min-h-[44px]"
                          >
                            Slet
                          </button>
                        </div>
                      </div>
                    )}
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

      {/* Stemmer (collapsible) */}
      <section>
        <button
          onClick={() => setVotesOpen(!votesOpen)}
          className="flex w-full items-center justify-between mb-4"
        >
          <h2 className="text-xl font-bold">
            Stemmer
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({votes.length} i alt)
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteAll(); }}>
              Slet alle
            </Button>
            <ChevronIcon open={votesOpen} />
          </div>
        </button>

        {votesOpen && (
          <>
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
          </>
        )}
      </section>
    </div>
  );
}
