"use client";

import PhoneVerifyForm from "@/components/features/PhoneVerifyForm";
import Card from "@/components/ui/Card";

export default function StemPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="mb-2 text-center text-3xl font-bold">Afgiv din stemme</h1>
      <p className="mb-8 text-center text-gray-600">
        Verificer dit nummer og stem anonymt for de tre krav.
      </p>
      <Card>
        <PhoneVerifyForm />
      </Card>
      <p className="mt-6 text-center text-xs text-gray-400">
        Dit telefonnummer hashas med en envejs-algoritme og kan ikke spores
        tilbage til dig. Læs mere på{" "}
        <a href="/om" className="underline hover:text-palestine-green">
          Om-siden
        </a>
        .
      </p>
    </div>
  );
}
