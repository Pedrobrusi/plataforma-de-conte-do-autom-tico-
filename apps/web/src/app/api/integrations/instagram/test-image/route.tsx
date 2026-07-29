import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const runtime = "nodejs";

export async function GET() {
  const timestamp = new Date().toLocaleString("pt-BR");

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1080px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#08090A",
          backgroundImage: "linear-gradient(135deg, #7C3AED, #EC4899, #F97316)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            padding: "48px",
            borderRadius: "24px",
            backgroundColor: "rgba(8,9,10,0.75)",
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 700, color: "#F5F5F5" }}>
            Teste de publicação
          </div>
          <div style={{ fontSize: 28, color: "#8B8D91" }}>{siteConfig.name}</div>
          <div style={{ fontSize: 22, color: "#8B8D91" }}>{timestamp}</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 },
  );
}
