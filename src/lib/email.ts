import nodemailer from "nodemailer";

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
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
  });

  await transporter.sendMail({
    from: `${fromName} <${from}>`,
    to,
    subject,
    text: body,
  });
}
