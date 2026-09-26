import { ImageResponse } from "next/og";

export const alt = "PlayPointy – Who is more likely to party card game";
export const size = { width: 1200, height: 630 };
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
          justifyContent: "center",
          padding: "72px 88px",
          background: "#171717",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            opacity: 0.7,
            marginBottom: 20,
          }}
        >
          Free party card game
        </div>
        <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 1.05 }}>
          PlayPointy
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 40,
            fontWeight: 500,
            opacity: 0.92,
          }}
        >
          Who is more likely to…
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 26,
            opacity: 0.62,
          }}
        >
          No download · No account · Play in the browser
        </div>
      </div>
    ),
    { ...size },
  );
}
