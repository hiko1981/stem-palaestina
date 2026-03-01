import { sendEmail } from "@/lib/email";
import { signOptout } from "@/lib/optout-sig";

interface CandidateForEmail {
  id: number;
  name: string;
  party: string;
  constituency: string;
  contactEmail: string | null;
  photoUrl: string | null;
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export async function sendVerificationEmail(candidate: CandidateForEmail): Promise<void> {
  if (!candidate.contactEmail) return;

  const sig = signOptout(candidate.id);
  const photoUploadUrl = `${getBaseUrl()}/kandidat/foto?cid=${candidate.id}&sig=${sig}`;
  const siteUrl = getBaseUrl();
  const needsPhoto = !candidate.photoUrl;

  const subject = `Velkommen som kandidat på Stem Palæstina, ${candidate.name}`;

  let body = `Kære ${candidate.name},

Tak for din deltagelse og din stemme på Stem Palæstina! Det betyder meget.

Du er nu godkendt som kandidat på platformen og synlig for alle besøgende på resultatsiden.

Din profil:
- Navn: ${candidate.name}
- Parti: ${candidate.party}
- Storkreds: ${candidate.constituency}
`;

  if (needsPhoto) {
    body += `
Vi mangler stadig et billede af dig til din profil. Upload dit billede her:
${photoUploadUrl}
`;
  }

  body += `
Del gerne dit standpunkt med dine vælgere:
${siteUrl}

Rigtig god valgkamp!

Venlig hilsen,
Hikmet Altun
Stem Palæstina
`;

  await sendEmail(candidate.contactEmail, subject, body);
}
