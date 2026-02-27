/**
 * Twilio Lookup v2 — checks carrier type to block VoIP/virtual numbers.
 * Only allows "mobile" numbers through.
 * Cost: ~$0.005 per lookup.
 */

const ALLOWED_TYPES = new Set(["mobile"]);

interface LookupResult {
  ok: boolean;
  type: string | null;
  error?: string;
}

export async function checkPhoneType(phone: string): Promise<LookupResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Skip check in dev mode (no Twilio credentials)
  if (!accountSid || !authToken) {
    return { ok: true, type: null };
  }

  try {
    const res = await fetch(
      `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(phone)}?Fields=line_type_intelligence`,
      {
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        },
      }
    );

    if (!res.ok) {
      // If lookup fails, allow the request through (fail-open)
      console.error(`Twilio Lookup failed: ${res.status}`);
      return { ok: true, type: null };
    }

    const data = await res.json();
    const lineType: string | undefined =
      data.line_type_intelligence?.type;

    if (!lineType || lineType === "unknown") {
      // Unknown type — allow through to avoid false positives
      return { ok: true, type: lineType || null };
    }

    if (ALLOWED_TYPES.has(lineType)) {
      return { ok: true, type: lineType };
    }

    return {
      ok: false,
      type: lineType,
      error: "Kun mobilnumre accepteres. Virtuelle numre og fastnet er ikke tilladt.",
    };
  } catch (err) {
    console.error("Twilio Lookup error:", err);
    // Fail-open on network errors
    return { ok: true, type: null };
  }
}
