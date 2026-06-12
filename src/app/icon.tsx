import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
            width: 342,
            height: 342,
            borderRadius: 92,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.96)",
            color: "#2e1065",
            fontSize: 118,
            fontWeight: 900,
            letterSpacing: -12,
            boxShadow: "0 42px 120px rgba(46,16,101,0.45)",
          }}
        >
          GG
        </div>
      </div>
    ),
    size
  );
}
