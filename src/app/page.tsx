import Link from "next/link";
import DemandsList from "@/components/features/DemandsList";
import VoteCounter from "@/components/features/VoteCounter";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Stem for{" "}
          <span className="text-palestine-green">Palæstina</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Vis at du som dansker kræver handling. Anonymt, sikkert og på under ét
          minut.
        </p>
        <Link
          href="/stem"
          className="mt-8 inline-flex items-center rounded-lg bg-palestine-green px-8 py-4 text-lg font-semibold text-white hover:bg-palestine-green-dark transition-colors"
        >
          Afgiv din stemme
        </Link>
      </section>

      {/* Tre krav */}
      <section className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold">
          Vi kræver tre ting
        </h2>
        <DemandsList />
      </section>

      {/* Stemmetæller */}
      <section className="mb-16 rounded-xl bg-gray-50 p-8">
        <VoteCounter />
      </section>

      {/* Anonymitet */}
      <section className="text-center">
        <h2 className="mb-4 text-xl font-bold">100% anonymt</h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          Dit telefonnummer bruges kun til verifikation og gemmes aldrig i
          forbindelse med din stemme. Ingen kan spore hvem der har stemt.
        </p>
        <Link
          href="/om"
          className="mt-4 inline-block text-sm text-palestine-green hover:underline"
        >
          Læs mere om vores anonymitetsgaranti
        </Link>
      </section>
    </div>
  );
}
