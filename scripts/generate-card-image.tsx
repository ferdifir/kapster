import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import * as fs from "fs";

const CARD_W = 1080;
const CARD_H = 1080;
const FONT_CACHE = "/tmp/kapster-inter-font.woff2";

interface CardData {
  platform: string;
  pillar: string;
  handle: string;
  title: string;
  description: string;
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
  both: "IG + TikTok",
};

async function getFontData(): Promise<Buffer> {
  if (fs.existsSync(FONT_CACHE)) {
    return fs.readFileSync(FONT_CACHE);
  }

  const cssUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap";
  const cssRes = await fetch(cssUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!cssRes.ok) throw new Error(`Font CSS failed: ${cssRes.status}`);
  const css = await cssRes.text();

  const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
  if (!match) throw new Error("Could not find font URL in CSS");

  const fontRes = await fetch(match[1]);
  if (!fontRes.ok) throw new Error(`Font download failed: ${fontRes.status}`);
  const buffer = Buffer.from(await fontRes.arrayBuffer());
  fs.writeFileSync(FONT_CACHE, buffer);
  console.log(`[card-image] Font cached: ${FONT_CACHE}`);
  return buffer;
}

function ScissorsIcon({ size = 24, color = "#e6a029" }: { size?: number; color?: string }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
    </svg>
  );
}

export async function generateCardImage(data: CardData): Promise<Buffer> {
  const fontData = await getFontData();
  const pillarColor = pillarColors[data.pillar] || "#f1ab2a";
  const pillarLabel = pillarLabels[data.pillar] || data.pillar;
  const platEmoji = platformEmoji[data.platform] || "📱";
  const platLabel = platformLabels[data.platform] || data.platform;

  const svg = await satori(
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        display: "flex",
        flexDirection: "column",
        background: "#141414",
        fontFamily: "Inter",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Gold glow top-right */}
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -200,
          width: 500,
          height: 500,
          background:
            "radial-gradient(circle, rgba(230,160,41,0.15) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* ===== TOP BAR ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "64px 72px 0",
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background:
                "linear-gradient(135deg, #f5c764, #e8950f, #c4740b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ScissorsIcon size={28} color="#111111" />
          </div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "0.5px",
            }}
          >
            Kapster
          </span>
        </div>

        {/* Social handle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 22px",
            borderRadius: 100,
            border: `1px solid ${pillarColor}40`,
            color: pillarColor,
            fontSize: 20,
            fontWeight: 600,
            background: `${pillarColor}15`,
          }}
        >
          <span>{platEmoji}</span>
          <span>@{data.handle}</span>
        </div>
      </div>

      {/* ===== CENTER CONTENT ===== */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          zIndex: 10,
          gap: 28,
        }}
      >
        {/* Big scissors icon */}
        <ScissorsIcon size={100} color="#e6a029" />

        {/* Title */}
        <h1
          style={{
            fontSize: 58,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.2,
            textAlign: "center",
            maxWidth: 860,
            letterSpacing: "-1px",
          }}
        >
          {data.title}
        </h1>

        {/* One-line description */}
        <p
          style={{
            fontSize: 26,
            color: "#a3a3a3",
            lineHeight: 1.5,
            textAlign: "center",
            maxWidth: 720,
          }}
        >
          {data.description}
        </p>

        {/* CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 32px",
            borderRadius: 100,
            background: "rgba(230,160,41,0.1)",
            border: "1px solid rgba(230,160,41,0.25)",
            color: "#e6a029",
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          <span>👇</span>
          <span>Baca caption lengkapnya di bawah</span>
        </div>
      </div>

      {/* ===== BOTTOM LINK ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "0 72px 56px",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 36px",
            borderRadius: 100,
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#ffffff",
            fontSize: 22,
            fontWeight: 600,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#e6a029" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          <span>kapster.my.id</span>
        </div>
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
          weight: 800,
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
