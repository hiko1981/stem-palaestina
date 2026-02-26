"use client";

import { useEffect, useState } from "react";

export default function VoteCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [thresholdReached, setThresholdReached] = useState(false);

  useEffect(() => {
    fetch("/api/votes/count")
      .then((res) => res.json())
      .then((data) => {
        setCount(data.count);
        setThresholdReached(data.thresholdReached);
      })
      .catch(() => {});
  }, []);

  if (!thresholdReached) {
    return (
      <div className="text-center">
        <p className="text-lg text-gray-600">
          Stemmerne offentliggøres når vi når <strong>50 stemmer</strong>.
        </p>
        <p className="text-sm text-gray-400 mt-1">Vær med til at nå målet.</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-5xl font-bold text-palestine-green">
        {count?.toLocaleString("da-DK")}
      </p>
      <p className="mt-2 text-lg text-gray-600">
        danskere har stemt for Palæstina
      </p>
    </div>
  );
}
