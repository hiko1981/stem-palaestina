"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  action: () => Promise<void>;
}

export default function OptoutConfirmButton({ action }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    await action();
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full rounded-lg bg-melon-red py-3 text-sm font-bold text-white transition-colors hover:bg-melon-red/90 disabled:opacity-50"
      >
        {loading ? "Afmelder..." : "Bekræft afmelding"}
      </button>
      <a
        href="/"
        className="block text-sm text-gray-400 hover:text-gray-600 hover:underline"
      >
        Annullér
      </a>
    </div>
  );
}
