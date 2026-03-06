import { ImageResponse } from "next/og";

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
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "radial-gradient(circle at 18% 20%, rgba(140,29,64,0.95) 0%, rgba(45,8,23,1) 45%), linear-gradient(135deg, #8c1d40 0%, #3b0b1d 100%)",
          color: "#fff6ea",
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: "0.08em",
            textTransform: "lowercase",
            opacity: 0.88,
          }}
        >
          asu.network
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              fontSize: 74,
              fontWeight: 700,
              lineHeight: 1,
              textTransform: "lowercase",
            }}
          >
            welcome to asu.network
          </div>
          <div
            style={{
              maxWidth: 940,
              fontSize: 34,
              lineHeight: 1.3,
              color: "#ffe1a3",
              textTransform: "lowercase",
            }}
          >
            discover builders, founders, and researchers across arizona state university.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
