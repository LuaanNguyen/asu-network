import { ImageResponse } from "next/og";
import { siteHost, siteName } from "@/lib/site";

export const alt = `${siteName} preview`;
export const size = {
  width: 1200,
  height: 675,
};
export const contentType = "image/png";

export default function TwitterImage() {
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
            "radial-gradient(circle at 24% 18%, #a13a5b 0%, transparent 42%), radial-gradient(circle at 84% 84%, #58243f 0%, transparent 42%), linear-gradient(135deg, #6f1d3a 0%, #2f1220 70%, #1f0f18 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 68px",
          }}
        >
          <p
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              gap: 12,
              fontSize: 26,
              border: "1px solid rgba(255, 220, 142, 0.28)",
              borderRadius: "999px",
              padding: "10px 18px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
            }}
          >
            <span
              style={{
                width: 13,
                height: 13,
                borderRadius: 999,
                backgroundColor: "#ffc627",
              }}
            />
            {siteHost}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p
              style={{
                margin: 0,
                fontSize: 74,
                fontWeight: 700,
                letterSpacing: -2.2,
              }}
            >
              {siteName}
            </p>
            <p
              style={{
                margin: 0,
                maxWidth: 1020,
                fontSize: 30,
                lineHeight: 1.22,
                color: "rgba(247, 244, 239, 0.88)",
              }}
            >
              a searchable webring to find people building at arizona state
              university.
            </p>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
