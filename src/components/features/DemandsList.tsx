import { DEMANDS } from "@/lib/constants";
import Card from "@/components/ui/Card";

export default function DemandsList() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {DEMANDS.map((demand, i) => (
        <Card key={i} className="text-center">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-palestine-green/10 text-palestine-green font-bold">
            {i + 1}
          </div>
          <h3 className="mb-2 text-lg font-bold">{demand.title}</h3>
          <p className="text-sm text-gray-600">{demand.description}</p>
        </Card>
      ))}
    </div>
  );
}
