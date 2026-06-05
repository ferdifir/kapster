import type { ToolDefinition, ToolResult } from "../types";
import { exec } from "child_process";
import { promisify } from "util";
import { createAdminClient } from "@/lib/supabase/admin";

const execAsync = promisify(exec);

export function createHackerTools(): Map<string, ToolDefinition> {
  const tools = new Map<string, ToolDefinition>();
  const supabase = createAdminClient();
  const agentEvents = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> };

  tools.set("exec_sql", {
    name: "exec_sql",
    description: "Jalankan SQL query di database. SELECT dan INSERT didukung. DDL butuh approval manual.",
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "SQL query" } },
      required: ["query"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const { data, error } = await supabase.rpc("exec_sql", { query_text: String(params.query) });
        if (error) return { success: false, error: error.message };
        return { success: true, data };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("exec_command", {
    name: "exec_command",
    description: "Jalankan shell command non-interaktif di server. READ-ONLY commands preferred.",
    parameters: {
      type: "object",
      properties: { command: { type: "string", description: "Shell command to execute" } },
      required: ["command"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const { stdout, stderr } = await execAsync(String(params.command), { timeout: 30000 });
        return { success: true, data: { stdout: stdout.slice(0, 4000), stderr: stderr.slice(0, 1000) } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("verify_build", {
    name: "verify_build",
    description: "Jalankan type check dan build verification di project kapster.",
    parameters: { type: "object", properties: {} },
    handler: async (): Promise<ToolResult> => {
      try {
        const { stdout, stderr } = await execAsync(
          "cd /home/ferdifir/development/kapster && npx tsc --noEmit 2>&1",
          { timeout: 120000 }
        );
        const success = !stderr && !stdout.includes("error");
        return { success, data: { output: stdout.slice(0, 2000) } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("check_metrics", {
    name: "check_metrics",
    description: "Cek metrics server terkini: CPU, memory, disk, uptime.",
    parameters: { type: "object", properties: {} },
    handler: async (): Promise<ToolResult> => {
      try {
        const { stdout: cpu } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'").catch(() => ({ stdout: "N/A" }));
        const { stdout: mem } = await execAsync("free -m | awk 'NR==2{printf \"%.1f%%\", $3*100/$2}'").catch(() => ({ stdout: "N/A" }));
        const { stdout: disk } = await execAsync("df -h / | awk 'NR==2{print $5}'").catch(() => ({ stdout: "N/A" }));
        const { stdout: uptime } = await execAsync("uptime -p").catch(() => ({ stdout: "N/A" }));
        return { success: true, data: { cpu: cpu.trim(), memory: mem.trim(), disk: disk.trim(), uptime: uptime.trim() } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  return tools;
}
