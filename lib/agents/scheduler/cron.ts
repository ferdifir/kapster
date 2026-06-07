import cron from "node-cron";
import { startDailyCycle } from "./daily-cycle";
import { logError } from "@/lib/error-logger";

let isRunning = false;

function shouldRun(): boolean {
  return process.env.AGENTS_DISABLED !== "true";
}

export function startScheduler(): void {
  // Daily at 06:00 WIB (UTC+7) = 23:00 UTC
  const task = cron.schedule(
    "0 23 * * *",
    async () => {
      if (!shouldRun()) {
        console.log("[agents] Scheduler disabled via AGENTS_DISABLED");
        return;
      }

      if (isRunning) {
        console.log("[agents] Previous cycle still running, skipping");
        return;
      }

      isRunning = true;
      try {
        console.log("[agents] Starting daily cycle...");
        const summary = await startDailyCycle();
        console.log("[agents] Daily cycle completed:", summary.slice(0, 100));
      } catch (error) {
        logError("agents/scheduler", error instanceof Error ? error : new Error(String(error)));
      } finally {
        isRunning = false;
      }
    },
    { timezone: "Asia/Jakarta" }
  );

  console.log("[agents] Scheduler started — daily cycle at 06:00 WIB");

  // Graceful shutdown
  process.on("SIGTERM", () => task.stop());
  process.on("SIGINT", () => task.stop());
}
