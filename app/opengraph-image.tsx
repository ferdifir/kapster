import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "QueueBarber — Sistem Antrian Barbershop #1 di Indonesia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
          background: "#0a0a0a",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Gold glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "400px",
            background:
              "radial-gradient(ellipse, rgba(241,171,42,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: "linear-gradient(135deg, #f5c764, #e8950f, #c4740b)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#111111"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
          </svg>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "white",
            letterSpacing: "-2px",
            display: "flex",
            gap: 0,
            marginBottom: 20,
          }}
        >
          <span>Queue</span>
          <span
            style={{
              background: "linear-gradient(135deg, #f9de9e, #f1ab2a, #c4740b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Barber
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#a3a3a3",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
            marginBottom: 40,
          }}
        >
          Sistem Antrian Barbershop #1 di Indonesia
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: "flex",
            gap: 48,
            padding: "20px 48px",
            background: "rgba(26,26,26,0.8)",
            borderRadius: 16,
            border: "1px solid rgba(241,171,42,0.2)",
          }}
        >
          {[
            { value: "500+", label: "Barbershop" },
            { value: "50K+", label: "Pelanggan/bulan" },
            { value: "4.9", label: "Rating" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  background:
                    "linear-gradient(135deg, #f9de9e, #f1ab2a, #c4740b)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {stat.value}
              </span>
              <span style={{ fontSize: 16, color: "#737373" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
