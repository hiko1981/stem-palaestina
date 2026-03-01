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

interface BallotTokenRecord {
  id: number;
  phoneHash: string;
  phone: string | null;
  used: boolean;
  expiresAt: string;
  createdAt: string;
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
  photoUpload: string | null;
  pledged: boolean;
  optedOut: boolean;
  optedOutAt: string | null;
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

interface SuppressionRecord {
  id: number;
  phoneHash: string;
  scope: string;
  reason: string;
  createdAt: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [tokens, setTokens] = useState<BallotTokenRecord[]>([]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportRecord[]>([]);
  const [suppressions, setSuppressions] = useState<SuppressionRecord[]>([]);
  const [langMisses, setLangMisses] = useState<LangMissRecord[]>([]);
  const [hitStats, setHitStats] = useState<HitStats | null>(null);
  const [expandedCandidate, setExpandedCandidate] = useState<number | null>(null);
  const [votesOpen, setVotesOpen] = useState(false);
  const [ballotOpen, setBallotOpen] = useState(false);
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
      setTokens(data.tokens || []);
      setCandidates(data.candidates || []);
      setSupportMessages(data.supportMessages || []);
      setSuppressions(data.suppressions || []);
      setAuthed(true);
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
      setTokens(data.tokens || []);
      setCandidates(data.candidates || []);
      setSupportMessages(data.supportMessages || []);
      setSuppressions(data.suppressions || []);
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
      const data = await res.json();
      if (verified && data.emailSent) {
        setMessage("Kandidat godkendt — bekræftelsesmail sendt");
      } else if (verified) {
        setMessage("Kandidat godkendt (ingen email — mangler emailadresse)");
      } else {
        setMessage("Kandidat afvist");
      }
      await fetchData();
    }
  }

  function maskHash(hash: string) {
    return hash.slice(0, 8) + "...";
  }

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

  const claimed = candidates.filter((c) => c.phoneHash);
  const pendingCandidates = claimed.filter((c) => !c.verified);
  const verifiedCandidates = claimed.filter((c) => c.verified);

  // Ballot token stats
  const now = new Date();
  const pendingBallots = tokens.filter((t) => !t.used && new Date(t.expiresAt) > now);
  const usedBallots = tokens.filter((t) => t.used);
  const expiredBallots = tokens.filter((t) => !t.used && new Date(t.expiresAt) <= now);

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

      {/* Stemmesedler (ballots) */}
      <section>
        <h2 className="text-xl font-bold mb-4">Stemmesedler (SMS)</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card>
            <p className="text-xs text-gray-500">Ventende</p>
            <p className="text-2xl font-bold tabular-nums text-amber-600">{pendingBallots.length}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500">Brugt (stemt)</p>
            <p className="text-2xl font-bold tabular-nums text-melon-green">{usedBallots.length}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500">Udløbet</p>
            <p className="text-2xl font-bold tabular-nums text-gray-400">{expiredBallots.length}</p>
          </Card>
        </div>

        {/* Pending ballots list */}
        {pendingBallots.length > 0 && (
          <div>
            <button
              onClick={() => setBallotOpen(!ballotOpen)}
              className="flex w-full items-center justify-between mb-2"
            >
              <h3 className="text-sm font-medium text-gray-500">
                Ventende stemmesedler ({pendingBallots.length})
              </h3>
              <ChevronIcon open={ballotOpen} />
            </button>
            {ballotOpen && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 pr-4">Telefon</th>
                      <th className="pb-2 pr-4">Sendt</th>
                      <th className="pb-2">Udløber</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingBallots.slice(0, 30).map((t) => (
                      <tr key={t.id} className="border-b">
                        <td className="py-2 pr-4 font-mono text-xs">
                          {t.phone || maskHash(t.phoneHash)}
                        </td>
                        <td className="py-2 pr-4 text-gray-500">
                          {new Date(t.createdAt).toLocaleString("da-DK")}
                        </td>
                        <td className="py-2 text-gray-500">
                          {new Date(t.expiresAt).toLocaleString("da-DK")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pendingBallots.length > 30 && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Viser de seneste 30 af {pendingBallots.length}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

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
                    <Button
                      onClick={() => verifyCandidate(c.id, true)}
                      className="text-xs px-3 py-2 min-h-[44px] shrink-0"
                    >
                      Godkend
                    </Button>
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
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                          <span>{new Date(c.createdAt).toLocaleString("da-DK")}</span>
                          {c.phoneHash && <span>&middot; {maskHash(c.phoneHash)}</span>}
                          {c.pledged && (
                            <span className="inline-flex items-center rounded-full bg-melon-green/10 text-melon-green px-2 py-0.5 font-medium">
                              Tilsluttet
                            </span>
                          )}
                        </div>
                        {c.publicStatement && (
                          <p className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">
                            {c.publicStatement}
                          </p>
                        )}
                        <div className="pt-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); verifyCandidate(c.id, false); }}
                            className="text-xs text-gray-400 hover:underline px-2 py-2 min-h-[44px]"
                          >
                            Fjern godkendelse
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

      {/* Foto-uploads */}
      {(() => {
        const photoUploads = candidates.filter((c) => c.photoUpload);
        if (photoUploads.length === 0) return null;
        return (
          <section>
            <h2 className="text-xl font-bold mb-4">
              Foto-uploads
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {photoUploads.length} nye
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {photoUploads.map((c) => (
                <Card key={c.id}>
                  <div className="text-center space-y-2">
                    <img
                      src={c.photoUpload!}
                      alt={c.name}
                      className="h-24 w-24 rounded-full object-cover mx-auto ring-2 ring-blue-200"
                    />
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.party}</p>
                    <a
                      href={c.photoUpload!}
                      download={`${c.id}.jpg`}
                      className="inline-block text-xs text-melon-green hover:underline"
                    >
                      Download
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        );
      })()}

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
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Opt-out / Suppressions */}
      <section>
        <h2 className="text-xl font-bold mb-4">
          Opt-out oversigt
          {suppressions.length > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {suppressions.length}
            </span>
          )}
        </h2>

        {(() => {
          const voterOptouts = suppressions.filter((s) => s.reason === "user_request");
          const candidateOptouts = suppressions.filter((s) => s.reason === "candidate_optout");
          const candidateInviteSuppressions = suppressions.filter((s) => s.reason.startsWith("candidate_optout:"));
          const optedOutCandidates = candidates.filter((c) => c.optedOut);

          return (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Card>
                  <p className="text-xs text-gray-500">Vælger-afmeldinger</p>
                  <p className="text-2xl font-bold tabular-nums">{voterOptouts.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Telefonnumre der har frabedt sig SMS</p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-500">Kandidat-afmeldinger</p>
                  <p className="text-2xl font-bold tabular-nums">{optedOutCandidates.length}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {candidateOptouts.length + candidateInviteSuppressions.length} telefon-suppressions
                  </p>
                </Card>
              </div>

              {optedOutCandidates.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Afmeldte kandidater</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-2 pr-4">Navn</th>
                          <th className="pb-2 pr-4">Parti</th>
                          <th className="pb-2 pr-4">Storkreds</th>
                          <th className="pb-2">Afmeldt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {optedOutCandidates.map((c) => (
                          <tr key={c.id} className="border-b">
                            <td className="py-2 pr-4 font-medium">{c.name}</td>
                            <td className="py-2 pr-4">{c.party}</td>
                            <td className="py-2 pr-4">{c.constituency}</td>
                            <td className="py-2 text-gray-500">
                              {c.optedOutAt
                                ? new Date(c.optedOutAt).toLocaleString("da-DK")
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {suppressions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Seneste suppressions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-2 pr-4">Phone Hash</th>
                          <th className="pb-2 pr-4">Type</th>
                          <th className="pb-2 pr-4">Årsag</th>
                          <th className="pb-2">Dato</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suppressions.slice(0, 20).map((s) => (
                          <tr key={s.id} className="border-b">
                            <td className="py-2 pr-4 font-mono text-xs">{maskHash(s.phoneHash)}</td>
                            <td className="py-2 pr-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  s.scope === "all"
                                    ? "bg-melon-red/10 text-melon-red"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {s.scope === "all" ? "Fuld blokering" : "Kandidat-invite"}
                              </span>
                            </td>
                            <td className="py-2 pr-4 text-gray-500">
                              {s.reason === "user_request"
                                ? "Vælger-afmelding"
                                : s.reason === "candidate_optout"
                                ? "Kandidat afmeldt"
                                : s.reason.startsWith("candidate_optout:")
                                ? `Kandidat #${s.reason.split(":")[1]} afmeldt`
                                : s.reason}
                            </td>
                            <td className="py-2 text-gray-500">
                              {new Date(s.createdAt).toLocaleString("da-DK")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {suppressions.length > 20 && (
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        Viser de seneste 20 af {suppressions.length} suppressions
                      </p>
                    )}
                  </div>
                </div>
              )}

              {suppressions.length === 0 && optedOutCandidates.length === 0 && (
                <Card className="text-center py-8">
                  <p className="text-gray-500 text-sm">Ingen opt-outs endnu.</p>
                </Card>
              )}
            </>
          );
        })()}
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

      {/* Stemmer (collapsible, read-only) */}
      <section>
        <button
          onClick={() => setVotesOpen(!votesOpen)}
          className="flex w-full items-center justify-between mb-4"
        >
          <h2 className="text-xl font-bold">
            Stemmer
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({votes.length} i alt — {votes.filter(v => v.voteValue).length} ja, {votes.filter(v => !v.voteValue).length} nej)
            </span>
          </h2>
          <ChevronIcon open={votesOpen} />
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
                      <th className="pb-2">Tidspunkt</th>
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
                        <td className="py-2 text-gray-500">
                          {new Date(v.votedAt).toLocaleString("da-DK")}
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
