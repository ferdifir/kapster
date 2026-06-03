"use server";

import { spawn } from "child_process";
import path from "path";
import { revalidatePath } from "next/cache";

export async function triggerSeoAudit() {
  const scriptPath = path.join(process.cwd(), "scripts/seo-audit.ts");
  spawn("npx", ["tsx", scriptPath], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env },
    shell: true,
  });
  revalidatePath("/admin/seo");
}
