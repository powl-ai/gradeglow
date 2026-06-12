import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 25% 20%, #f0abfc 0, transparent 35%), linear-gradient(135deg, #2e1065 0%, #7c3aed 48%, #ec4899 100%)",
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.96)",
            color: "#2e1065",
            fontSize: 42,
            fontWeight: 900,
            letterSpacing: -4,
          }}
        >
          GG
        </div>
      </div>
    ),
    size
  );
}
