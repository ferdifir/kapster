import { sendTelegramNotification } from "./telegram";

function formatError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}`;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export async function logError(context: string, error: unknown, metadata?: Record<string, unknown>) {
  const timestamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

  const parts = [
    `🚨 <b>System Error</b>`,
    `📍 ${context}`,
    `🕐 ${timestamp}`,
    ``,
    `<code>${formatError(error)}</code>`,
  ];

  if (metadata && Object.keys(metadata).length > 0) {
    const metaLines = Object.entries(metadata)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}: ${String(v).slice(0, 500)}`);
    if (metaLines.length > 0) {
      parts.push("", "<b>Metadata:</b>", ...metaLines);
    }
  }

  sendTelegramNotification(parts.join("\n"));
}
