/**
 * Phone number utilities — E.164 normalization and country dial code lookup.
 * Ported from localislam.
 */

export const DIAL_CODES: Record<string, string> = {
  // Scandinavia
  DK: "+45", NO: "+47", SE: "+46", FI: "+358",
  // Western Europe
  DE: "+49", FR: "+33", NL: "+31", BE: "+32", AT: "+43",
  GB: "+44", IE: "+353", CH: "+41", LU: "+352", IS: "+354",
  // Southern Europe
  IT: "+39", ES: "+34", PT: "+351", GR: "+30", CY: "+357",
  // Eastern Europe
  PL: "+48", CZ: "+420", SK: "+421", HU: "+36", RO: "+40",
  BG: "+359", HR: "+385", SI: "+386", RS: "+381", BA: "+387",
  MK: "+389", AL: "+355", ME: "+382", XK: "+383",
  // Baltic
  EE: "+372", LV: "+371", LT: "+370",
  // Turkey
  TR: "+90",
  // Middle East
  SA: "+966", AE: "+971", QA: "+974", KW: "+965", BH: "+973",
  OM: "+968", YE: "+967", JO: "+962", LB: "+961", SY: "+963",
  IQ: "+964", IR: "+98", IL: "+972", PS: "+970",
  // North Africa
  EG: "+20", MA: "+212", TN: "+216", LY: "+218", DZ: "+213", SD: "+249",
  // Sub-Saharan Africa
  SO: "+252", ET: "+251", ER: "+291", DJ: "+253",
  KE: "+254", TZ: "+255", UG: "+256", RW: "+250",
  NG: "+234", GH: "+233", SN: "+221", CI: "+225", ML: "+223",
  ZA: "+27", ZM: "+260", ZW: "+263",
  // South Asia
  PK: "+92", BD: "+880", IN: "+91", LK: "+94", NP: "+977", AF: "+93",
  // Southeast Asia
  ID: "+62", MY: "+60", SG: "+65", PH: "+63", TH: "+66",
  VN: "+84", MM: "+95", KH: "+855",
  // East Asia
  CN: "+86", JP: "+81", KR: "+82", TW: "+886",
  // Central Asia / ex-Soviet
  RU: "+7", KZ: "+7", UA: "+380", AZ: "+994", GE: "+995",
  AM: "+374", UZ: "+998", TM: "+993", KG: "+996", TJ: "+992",
  // Americas
  US: "+1", CA: "+1", MX: "+52", BR: "+55", AR: "+54",
  CO: "+57", CL: "+56", PE: "+51", VE: "+58",
  // Oceania
  AU: "+61", NZ: "+64",
};

/** Returns the dial code for a country ISO code, defaulting to +45 (DK). */
export function getDialCode(countryCode: string): string {
  return DIAL_CODES[countryCode?.toUpperCase()] ?? "+45";
}

/**
 * Normalize a phone number to E.164 format.
 * Returns null if the number is clearly invalid.
 */
export function normalizeToE164(raw: string, dialCode: string): string | null {
  let phone = raw.replace(/[\s\-\.\(\)\/]/g, "");
  if (!phone) return null;

  if (phone.startsWith("+")) {
    const digits = phone.slice(1).replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) return null;
    return `+${digits}`;
  }

  if (phone.startsWith("00")) {
    const digits = phone.slice(2).replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) return null;
    return `+${digits}`;
  }

  if (phone.startsWith("0")) {
    phone = phone.slice(1);
  }

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 5 || digits.length > 12) return null;

  const dialDigits = dialCode.replace(/\D/g, "");
  return `+${dialDigits}${digits}`;
}

/** Validate that a string looks like an E.164 number. */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

/** Returns all dial codes as a sorted list of {country, code} entries. */
export function getDialCodeList(): { country: string; code: string }[] {
  return Object.entries(DIAL_CODES)
    .map(([country, code]) => ({ country, code }))
    .sort((a, b) => a.country.localeCompare(b.country));
}
