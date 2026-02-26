import { SMS_CODE_LENGTH } from "./constants";

export function generateCode(): string {
  const digits = [];
  for (let i = 0; i < SMS_CODE_LENGTH; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }
  return digits.join("");
}

export async function sendSms(phone: string, message: string): Promise<void> {
  const token = process.env.GATEWAYAPI_TOKEN;
  if (!token) {
    // Dev mode: log koden til konsollen
    console.log(`[SMS DEV] Til ${phone}: ${message}`);
    return;
  }

  const res = await fetch("https://gatewayapi.com/rest/mtsms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      sender: "StemPal",
      message,
      recipients: [{ msisdn: phone.replace(/\D/g, "") }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GatewayAPI fejl: ${res.status} ${text}`);
  }
}
