export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Stem Palæstina <noreply@stem-palaestina.dk>";

  if (!apiKey) {
    console.log(`[EMAIL DEV] Til ${to}: ${subject}\n${body}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: body,
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(`Resend fejl: ${res.status} ${data.message || JSON.stringify(data)}`);
  }
}
