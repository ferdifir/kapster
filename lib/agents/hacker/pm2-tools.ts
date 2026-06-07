import { execSync } from "child_process";
import { logError } from "@/lib/error-logger";

let lastRestartTime = 0;
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

function run(cmd: string): string {
  return execSync(cmd, { encoding: "utf-8" }).trim();
}

export interface Pm2Status {
  online: boolean;
  pid: number | null;
  memory: string;
  cpu: string;
  uptime: string;
  restarts: number;
}

function isPm2NotFound(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("command not found") || msg.includes("not found") || msg.includes("ENOENT");
}

export async function getLogs(lines = 100): Promise<string> {
  try {
    return run(`pm2 logs kapster --lines ${lines} --nostream`);
  } catch {
    return "PM2 not available";
  }
}

export async function getStatus(): Promise<Pm2Status | string> {
  try {
    const output = run(`pm2 show kapster`);
    const lines = output.split("\n");

    return {
      online: output.includes("online"),
      pid: extractValue(lines, "pid"),
      memory: extractValue(lines, "memory") ?? "unknown",
      cpu: extractValue(lines, "cpu") ?? "unknown",
      uptime: extractValue(lines, "uptime") ?? "unknown",
      restarts: extractValue(lines, "restarts") ?? 0,
    } as Pm2Status;
  } catch {
    return "PM2 not available";
  }
}

export async function restart(): Promise<void> {
  const now = Date.now();
  if (now - lastRestartTime < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - (now - lastRestartTime)) / 1000);
    throw new Error(`PM2 restart cooldown: ${remaining}s remaining`);
  }

  try {
    run(`pm2 restart kapster`);
    lastRestartTime = Date.now();
  } catch (error) {
    if (isPm2NotFound(error)) {
      throw new Error("PM2 not installed on this server");
    }
    logError("hacker/pm2-restart", error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

function extractValue(lines: string[], key: string): unknown {
  const line = lines.find((l) => l.toLowerCase().includes(key));
  if (!line) return null;
  const parts = line.split(/\s{2,}/);
  return parts[parts.length - 1]?.trim() ?? null;
}
