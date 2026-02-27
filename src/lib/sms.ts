export async function sendSms(phone: string, message: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.replace(/\\n/g, "").trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.replace(/\\n/g, "").trim();
  const from = (process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_FROM)?.replace(/\\n/g, "").trim();

  if (!accountSid || !authToken || !from) {
    // Dev mode: log til konsollen
    console.log(`[SMS DEV] Til ${phone}: ${message}`);
    return;
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      },
      body: new URLSearchParams({
        To: phone,
        From: from,
        Body: message,
      }),
    }
  );

  if (!res.ok) {
    const data = await res.json();
    throw new Error(`Twilio fejl: ${res.status} ${data.message}`);
  }
}
