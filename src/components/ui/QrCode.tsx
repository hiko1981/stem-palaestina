"use client";

import { QRCodeSVG } from "qrcode.react";

interface QrCodeProps {
  value: string;
  size?: number;
}

export default function QrCode({ value, size = 256 }: QrCodeProps) {
  return (
    <div className="inline-flex rounded-xl bg-white p-4 shadow-sm">
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        includeMargin={false}
      />
    </div>
  );
}
