import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Stem Palæstina";

export default async function OgImage() {
  const iconPath = join(process.cwd(), "public", "icon-512.png");
  const iconData = await readFile(iconPath);
  const iconBase64 = `data:image/png;base64,${iconData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FAFAFA",
          position: "relative",
        }}
      >
        {/* Top green bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            backgroundColor: "#2E7D32",
          }}
        />

        {/* Bottom red bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            backgroundColor: "#DD2E44",
          }}
        />

        {/* Watermelon icon */}
        <img
          src={iconBase64}
          alt=""
          width={180}
          height={180}
          style={{ marginBottom: 32, borderRadius: 36 }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
          }}
        >
          Stem Pal&aelig;stina
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#666",
            marginTop: 16,
          }}
        >
          Stem for anerkendelse af Pal&aelig;stina
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 22,
            color: "#999",
          }}
        >
          stem-palaestina.dk
        </div>
      </div>
    ),
    { ...size }
  );
}
