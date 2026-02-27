"use client";

import { useTranslations } from "next-intl";

export default function PhoneNote() {
  const b = useTranslations("ballot");

  const note = b("phoneNote", {
    link: `__LINK__`,
  });

  // Split on __LINK__ and inject the <a> tag
  const parts = note.split("__LINK__");

  return (
    <p className="text-center text-[11px] text-gray-400">
      {parts[0]}
      <a href="/om" className="underline hover:text-melon-green">
        {b("phoneNoteLink")}
      </a>
      {parts[1] || ""}
    </p>
  );
}
