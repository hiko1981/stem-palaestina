import Card from "@/components/ui/Card";

export default function OmPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-center text-3xl font-bold">Om Stem Palæstina</h1>

      <div className="space-y-8">
        <Card>
          <h2 className="text-xl font-bold mb-3">Hvad er Stem Palæstina?</h2>
          <p className="text-gray-600 leading-relaxed">
            Stem Palæstina er en borgerplatform hvor danskere anonymt kan vise deres
            støtte til tre konkrete krav til den danske regering: anerkendelse af
            staten Palæstina, stop for våbensalg til Israel og stop for ulovlige
            investeringer i besættelsen.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-3">Hvordan fungerer anonymiteten?</h2>
          <div className="text-gray-600 leading-relaxed space-y-3">
            <p>
              Vi tager din anonymitet meget alvorligt. Sådan fungerer det:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>Verifikation:</strong> Dit telefonnummer bruges til at sende en
                engangskode via SMS. Vi gemmer kun en kryptografisk hash (envejs) af
                nummeret for at forhindre duplikater.
              </li>
              <li>
                <strong>Adskillelse:</strong> Efter verifikation genereres et tilfældigt,
                anonymt token. Der er ingen teknisk forbindelse mellem dit nummer og
                din stemme i databasen.
              </li>
              <li>
                <strong>Stemmeafgivelse:</strong> Din stemme registreres kun med det
                anonyme token. Selv med fuld adgang til databasen er det umuligt at
                spore en stemme tilbage til et telefonnummer.
              </li>
            </ol>
            <p className="text-sm font-medium">
              Vi gemmer ingen IP-adresser, ingen cookies og ingen persondata i
              forbindelse med stemmer.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-3">Bundling af stemmer</h2>
          <p className="text-gray-600 leading-relaxed">
            For at beskytte tidlige stemmere vises det samlede antal stemmer først
            når der er mindst 50. Indtil da vises kun at indsamlingen er i gang.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-3">De tre krav</h2>
          <div className="text-gray-600 leading-relaxed space-y-3">
            <div>
              <h3 className="font-semibold text-gray-800">1. Anerkend Palæstina</h3>
              <p className="text-sm">
                Danmark skal officielt anerkende staten Palæstina som en suveræn stat.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">2. Stop våbensalg til Israel</h3>
              <p className="text-sm">
                Alt salg og eksport af våben og militærudstyr til Israel skal stoppes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">3. Stop ulovlige investeringer</h3>
              <p className="text-sm">
                Danske pensionskasser og offentlige fonde skal trække investeringer ud
                af virksomheder der profiterer på den ulovlige besættelse.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-3">Teknisk sikkerhed</h2>
          <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
            <li>SHA-256 hashing af telefonnumre med server-side salt</li>
            <li>JWT-tokens med 15 minutters udløb</li>
            <li>Cloudflare Turnstile captcha mod bots</li>
            <li>Rate limiting på alle endpoints</li>
            <li>Ingen tredjepartstracking eller analytics</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
