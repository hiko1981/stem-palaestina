import Card from "@/components/ui/Card";

export default function KandidaterPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-4 text-center text-3xl font-bold">Kandidater</h1>
      <Card className="text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Kommer snart
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Her vil du snart kunne se hvilke kandidater der offentligt har
          tilsluttet sig de tre krav. Vi arbejder på at gøre det muligt for
          kandidater at registrere deres støtte.
        </p>
      </Card>
    </div>
  );
}
