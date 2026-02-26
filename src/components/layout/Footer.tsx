import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-sm text-gray-500">
          <div className="flex gap-6">
            <Link href="/om" className="hover:text-palestine-green transition-colors">
              Om projektet
            </Link>
            <Link href="/kandidater" className="hover:text-palestine-green transition-colors">
              Kandidater
            </Link>
          </div>
          <p>
            Din stemme er 100% anonym. Vi gemmer ingen persondata.
          </p>
          {/* Palæstinensisk flag-streg */}
          <div className="flex h-1 w-32 overflow-hidden rounded-full">
            <div className="flex-1 bg-palestine-black" />
            <div className="flex-1 bg-white border-y border-gray-200" />
            <div className="flex-1 bg-palestine-green" />
            <div className="flex-1 bg-palestine-red" />
          </div>
        </div>
      </div>
    </footer>
  );
}
