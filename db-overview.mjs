import pg from "pg";
const pool = new pg.Pool({ connectionString: "postgresql://postgres.rdceqyclcthmtfgdfwyx:AuIroyQenpimyxCiwgIUy0bRlJODmk@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true" });
const res = await pool.query(`SELECT id, name, party, constituency, contact_email, contact_phone, phone_hash IS NOT NULL as claimed, verified FROM candidates ORDER BY party, constituency, name`);

const byParty = {};
for (const r of res.rows) {
  if (!byParty[r.party]) byParty[r.party] = [];
  byParty[r.party].push(r);
}
for (const party of Object.keys(byParty).sort()) {
  const candidates = byParty[party];
  const withEmail = candidates.filter(c => c.contact_email).length;
  const withPhone = candidates.filter(c => c.contact_phone).length;
  const claimed = candidates.filter(c => c.claimed || c.verified).length;
  console.log(`\n=== ${party} (${candidates.length} kand, ${withEmail} email, ${withPhone} tlf, ${claimed} claimed) ===`);
  for (const c of candidates) {
    const flags = [];
    if (c.claimed || c.verified) flags.push("LOCKED");
    if (c.contact_email) flags.push("E");
    if (c.contact_phone) flags.push("P");
    console.log(`  ${c.id}: ${c.name.trim()} | ${c.constituency} [${flags.join(",")}]`);
  }
}
console.log("\nTotal:", res.rows.length);
await pool.end();
