import { sendSms } from "./sms";

const ADMIN_PHONE = process.env.ADMIN_PHONE;

function getBaseUrl() {
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  return "https://stem-palaestina.vercel.app";
}

/**
 * Send admin SMS notification (fire-and-forget, never throws).
 */
export function notifyAdminNewCandidate(name: string, party: string, constituency: string) {
  if (!ADMIN_PHONE) return;

  const adminUrl = `${getBaseUrl()}/admin`;
  const msg = `Ny kandidatansøgning på Stem Palæstina:\n\n${name} (${party})\n${constituency}\n\nGodkend her: ${adminUrl}`;

  sendSms(`+45${ADMIN_PHONE}`, msg).catch((err) => {
    console.error("Admin SMS notification failed:", err);
  });
}
