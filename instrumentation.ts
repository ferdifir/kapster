export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./lib/agents/scheduler/cron");
    startScheduler();
  }
}
