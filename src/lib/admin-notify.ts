import { sendSms } from "./sms";

const ADMIN_PHONE = process.env.ADMIN_PHONE;

function getBaseUrl() {
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  return "https://vote-palestine.com";
}

/**
 * Send admin SMS notification (fire-and-forget, never throws).
 */
export function notifyAdminNewCandidate(name: string, party: string, constituency: string) {
  if (!ADMIN_PHONE) return;

  const adminUrl = `${getBaseUrl()}/admin`;
  const msg = `Ny kandidatansøgning på Stem Palæstina:\n\n${name} (${party})\n${constituency}\n\nGodkend her: ${adminUrl}`;

  sendSms(ADMIN_PHONE, msg).catch((err) => {
    console.error("Admin SMS notification failed:", err);
  });
}

/**
 * Send admin SMS notification for new support message (fire-and-forget).
 */
export function notifyAdminNewSupport(category: string, message: string) {
  if (!ADMIN_PHONE) return;

  const adminUrl = `${getBaseUrl()}/admin`;
  const preview = message.length > 80 ? message.slice(0, 80) + "..." : message;
  const msg = `Ny supportbesked på Stem Palæstina:\n\n[${category}]\n${preview}\n\nSe alle: ${adminUrl}`;

  sendSms(ADMIN_PHONE, msg).catch((err) => {
    console.error("Admin SMS (support) failed:", err);
  });
}
