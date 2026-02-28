import nodemailer from "nodemailer";

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  // Prefer Resend HTTP API (works reliably from serverless)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const from = process.env.RESEND_FROM || "Stem Palæstina <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({ from, to, subject, text: body }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(`Resend: ${res.status} ${data.message || JSON.stringify(data)}`);
    }
    return;
  }

  // Fallback: SMTP via nodemailer
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const fromName = process.env.SMTP_FROM_NAME || "Stem Palæstina";
  const port = Number(process.env.SMTP_PORT || "587");

  if (!host || !user || !pass || !from) {
    console.log(`[EMAIL DEV] Til ${to}: ${subject}\n${body}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { servername: process.env.SMTP_SERVERNAME || host },
  });

  await transporter.sendMail({
    from: `${fromName} <${from}>`,
    to,
    subject,
    text: body,
  });
}
