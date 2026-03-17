import { ImageResponse } from "next/og";
import { siteHost, siteName } from "@/lib/site";

export const alt = `${siteName} preview`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          fontFamily: "sans-serif",
          color: "#f7f4ef",
          background:
            "radial-gradient(circle at 15% 18%, #a13a5b 0%, transparent 42%), radial-gradient(circle at 84% 78%, #59203e 0%, transparent 40%), linear-gradient(135deg, #6f1d3a 0%, #3b1525 65%, #251018 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "58px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              gap: "14px",
              border: "1px solid rgba(255, 231, 184, 0.35)",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              borderRadius: "999px",
              padding: "10px 18px",
              fontSize: 24,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                backgroundColor: "#ffc627",
              }}
            />
            welcome to {siteHost}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <p
              style={{
                margin: 0,
                fontSize: 72,
                fontWeight: 700,
                letterSpacing: -2.1,
              }}
            >
              {siteName}
            </p>
            <p
              style={{
                margin: 0,
                maxWidth: 980,
                fontSize: 32,
                lineHeight: 1.22,
                color: "rgba(247, 244, 239, 0.9)",
              }}
            >
              discover and connect with arizona state university builders,
              engineers, creators, and researchers.
            </p>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
