import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-palestine-black">
          Stem <span className="text-palestine-green">Palæstina</span>
        </Link>
        <div className="flex gap-6 text-sm font-medium">
          <Link
            href="/stem"
            className="text-gray-600 hover:text-palestine-green transition-colors"
          >
            Stem
          </Link>
          <Link
            href="/kandidater"
            className="text-gray-600 hover:text-palestine-green transition-colors"
          >
            Kandidater
          </Link>
          <Link
            href="/om"
            className="text-gray-600 hover:text-palestine-green transition-colors"
          >
            Om
          </Link>
        </div>
      </nav>
    </header>
  );
}
