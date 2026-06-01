import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import * as fs from "fs";
import * as path from "path";

const CARD_W = 1080;
const CARD_H = 1080;
const FONT_CACHE = "/tmp/kapster-inter-font.woff2";

interface CardData {
  platform: string;
  pillar: string;
  hook: string;
  body: string;
  topic: string;
}

const pillarColors: Record<string, string> = {
  educational: "#3b82f6",
  solution: "#f1ab2a",
  social_proof: "#22c55e",
};

const pillarLabels: Record<string, string> = {
  educational: "Edukasi",
  solution: "Solusi",
  social_proof: "Bukti Sosial",
};

const platformEmoji: Record<string, string> = {
  instagram: "📸",
  tiktok: "🎵",
  both: "📱",
};

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  both: "Instagram + TikTok",
};

async function getFontData(): Promise<Buffer> {
  if (fs.existsSync(FONT_CACHE)) {
    return fs.readFileSync(FONT_CACHE);
  }

  // Fetch Google Fonts CSS to get the actual woff2 URL
  const cssUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap";
  const cssRes = await fetch(cssUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!cssRes.ok) throw new Error(`Font CSS failed: ${cssRes.status}`);
  const css = await cssRes.text();

  // Parse the first woff2 URL from the CSS
  const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
  if (!match) throw new Error("Could not find font URL in CSS");

  const fontRes = await fetch(match[1]);
  if (!fontRes.ok) throw new Error(`Font download failed: ${fontRes.status}`);
  const buffer = Buffer.from(await fontRes.arrayBuffer());
  fs.writeFileSync(FONT_CACHE, buffer);
  console.log(`[card-image] Font cached: ${FONT_CACHE}`);
  return buffer;
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).replace(/\s+\S*$/, "") + "…";
}

export async function generateCardImage(data: CardData): Promise<Buffer> {
  const fontData = await getFontData();
  const pillarColor = pillarColors[data.pillar] || "#f1ab2a";
  const pillarLabel = pillarLabels[data.pillar] || data.pillar;
  const platEmoji = platformEmoji[data.platform] || "📱";
  const platLabel = platformLabels[data.platform] || data.platform;
  const bodyPreview = truncateText(data.body, 280);

  const svg = await satori(
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        display: "flex",
        flexDirection: "column",
        background: "#0a0a0a",
        fontFamily: "Inter",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Gold glow top */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 500,
          background:
            "radial-gradient(ellipse, rgba(241,171,42,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "64px 56px 48px",
        }}
      >
        {/* Badges */}
        <div style={{ display: "flex", gap: 12, marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 18px",
              borderRadius: 100,
              background: "rgba(255,255,255,0.08)",
              color: "#e5e5e5",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            <span>{platEmoji}</span>
            <span>{platLabel}</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 18px",
              borderRadius: 100,
              background: `${pillarColor}20`,
              color: pillarColor,
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {pillarLabel}
          </div>
        </div>

        {/* Hook */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: "#f5f5f5",
            lineHeight: 1.15,
            letterSpacing: "-1px",
            marginBottom: 32,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {data.hook}
        </div>

        {/* Body */}
        <div
          style={{
            fontSize: 26,
            color: "#a3a3a3",
            lineHeight: 1.5,
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 7,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {bodyPreview}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "32px 56px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background:
                "linear-gradient(135deg, #f5c764, #e8950f, #c4740b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 900,
              color: "#111",
            }}
          >
            K
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#f5f5f5",
              }}
            >
              Kapster
            </span>
            <span style={{ fontSize: 14, color: "#737373" }}>
              Sistem Antrian Barbershop
            </span>
          </div>
        </div>
        <span style={{ fontSize: 14, color: "#525252" }}>
          {data.topic}
        </span>
      </div>
    </div>,
    {
      width: CARD_W,
      height: CARD_H,
      fonts: [
        {
          name: "Inter",
          data: fontData,
          weight: 400,
          style: "normal",
        },
        {
          name: "Inter",
          data: fontData,
          weight: 600,
          style: "normal",
        },
        {
          name: "Inter",
          data: fontData,
          weight: 700,
          style: "normal",
        },
        {
          name: "Inter",
          data: fontData,
          weight: 900,
          style: "normal",
        },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: CARD_W },
  });
  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}
