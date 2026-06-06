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

  tools.set("read_logs", {
    name: "read_logs",
    description: "Baca log aplikasi terbaru. Bisa baca PM2 logs atau system log.",
    parameters: {
      type: "object",
      properties: {
        lines: { type: "number", description: "Jumlah baris log (default 50)" },
        service: { type: "string", enum: ["kapster", "agent-worker", "all"], description: "Nama service PM2 (default all)" },
      },
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const lines = (params.lines as number) || 50;
        const service = (params.service as string) || "all";
        const { stdout } = await execAsync(
          `pm2 logs ${service === "all" ? "" : service} --lines ${lines} --nostream --raw 2>&1 | tail -${lines}`,
          { timeout: 15000 }
        );
        return { success: true, data: { logs: stdout.slice(0, 4000) } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("manage_cron", {
    name: "manage_cron",
    description: "Kelola cron job (list/add/remove). Bisa lewat system crontab atau pg_cron.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["list", "add", "remove"], description: "Operasi cron" },
        name: { type: "string", description: "Nama cron job (required untuk remove)" },
        schedule: { type: "string", description: "Cron expression (required untuk add). Contoh: '0 8 * * *'" },
        command: { type: "string", description: "Perintah yang dijalankan (required untuk add)" },
      },
      required: ["action"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        if (params.action === "list") {
          const { stdout } = await execAsync("crontab -l 2>&1", { timeout: 5000 });
          return { success: true, data: { crontab: stdout || "(no crontab)" } };
        }
        if (params.action === "add") {
          if (!params.schedule || !params.command) return { success: false, error: "schedule and command required for add" };
          const existing = await execAsync("crontab -l 2>&1", { timeout: 5000 }).catch(() => ({ stdout: "" }));
          const newLine = `${params.schedule} ${params.command}`;
          if (existing.stdout.includes(String(params.command))) {
            return { success: true, data: { message: "Cron already exists, skipped" } };
          }
          await execAsync(`(echo "${existing.stdout.replace(/\n$/, "")}" ; echo "${newLine}") | crontab -`, { timeout: 5000 });
          return { success: true, data: { message: "Cron added" } };
        }
        if (params.action === "remove") {
          if (!params.name) return { success: false, error: "name required for remove" };
          const { stdout } = await execAsync(`crontab -l | grep -v "${String(params.name)}" | crontab -`, { timeout: 5000 });
          return { success: true, data: { message: `Cron '${params.name}' removed (if existed)` } };
        }
        return { success: false, error: "Unknown action" };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("trigger_deploy", {
    name: "trigger_deploy",
    description: "Trigger deployment via GitHub Actions. Push ke main akan otomatis deploy ke VPS.",
    parameters: {
      type: "object",
      properties: {
        branch: { type: "string", description: "Branch yang dideploy (default: main)" },
      },
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const token = process.env.GITHUB_TOKEN || process.env.PAT_TOKEN;
        if (!token) return { success: false, error: "No GitHub token available" };
        const branch = (params.branch as string) || "main";
        const res = await fetch(
          "https://api.github.com/repos/ferdifir/kapster/actions/workflows/release.yml/dispatches",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "User-Agent": "kapster-agent",
            },
            body: JSON.stringify({ ref: branch }),
          }
        );
        if (!res.ok) return { success: false, error: `GitHub API error ${res.status}: ${await res.text()}` };
        return { success: true, data: { message: `Deploy triggered on ${branch}` } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("restart_service", {
    name: "restart_service",
    description: "Restart service PM2 (kapster atau agent-worker).",
    parameters: {
      type: "object",
      properties: {
        service: { type: "string", enum: ["kapster", "agent-worker", "all"], description: "Service yang direstart" },
      },
      required: ["service"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const service = String(params.service);
        const { stdout, stderr } = await execAsync(`pm2 restart ${service}`, { timeout: 30000 });
        return { success: true, data: { stdout: stdout.slice(0, 1000), stderr: stderr.slice(0, 500) } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("run_migration", {
    name: "run_migration",
    description: "Jalankan migration SQL dari file di supabase/migrations/. List dulu file yang available, lalu execute yang pending.",
    parameters: {
      type: "object",
      properties: {
        file: { type: "string", description: "Nama file migration (contoh: 20260606_add_agent_plans.sql). Kosongin untuk list pending." },
        sql: { type: "string", description: "SQL langsung yang mau dijalanin (alternatif ke file)" },
      },
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        if (params.sql) {
          const { data, error } = await supabase.rpc("exec_sql", { query_text: String(params.sql) });
          if (error) return { success: false, error: error.message };
          return { success: true, data };
        }
        if (params.file) {
          const fs = await import("fs/promises");
          const path = await import("path");
          const projectRoot = process.cwd();
          const fullPath = path.join(projectRoot, "supabase/migrations", String(params.file));
          const sql = await fs.readFile(fullPath, "utf-8");
          const { data, error } = await supabase.rpc("exec_sql", { query_text: sql });
          if (error) return { success: false, error: error.message };
          return { success: true, data: { message: `Migration ${params.file} executed`, output: data } };
        }
        const fs = await import("fs/promises");
        const path = await import("path");
        const dir = path.join(process.cwd(), "supabase/migrations");
        const files = await fs.readdir(dir);
        return { success: true, data: { pending_migrations: files.filter(f => f.endsWith(".sql")).sort() } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("generate_tool", {
    name: "generate_tool",
    description: "Buat tool baru untuk agent tertentu. Tool akan terdaftar di sistem dan bisa langsung dipakai setelah register.",
    parameters: {
      type: "object",
      properties: {
        target_role: { type: "string", enum: ["hacker", "hipster", "hustler"], description: "Agent yang akan punya tool ini" },
        tool_name: { type: "string", description: "Nama tool (snake_case)" },
        description: { type: "string", description: "Deskripsi tool" },
        parameters: {
          type: "object",
          description: "JSON Schema parameter tool. Contoh: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }",
        },
      },
      required: ["target_role", "tool_name", "description"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const { registerTool } = await import("./index");
        const role = params.target_role as "hacker" | "hipster" | "hustler";
        const toolName = String(params.tool_name);
        registerTool(role, {
          name: toolName,
          description: String(params.description),
          parameters: (params.parameters as Record<string, unknown>) || { type: "object", properties: {} },
          handler: async (callParams): Promise<ToolResult> => {
            return { success: true, data: { message: `Tool ${toolName} executed`, params: callParams } };
          },
        });
        return { success: true, data: { message: `Tool '${toolName}' registered for ${role}` } };
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
