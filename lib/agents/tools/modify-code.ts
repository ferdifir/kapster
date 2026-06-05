import type { ToolDefinition, ToolResult } from "../types";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);
const PROJECT_ROOT = process.cwd();

export const modifyCodeTool: ToolDefinition = {
  name: "modify_code",
  description: "Baca, buat, atau modifikasi file kode di project. Setelah write, jalankan verify_build untuk cek kompilasi.",
  parameters: {
    type: "object",
    properties: {
      files: {
        type: "array",
        items: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["read", "write", "edit"], description: "read: baca file, write: buat/overwrite, edit: replace string" },
            path: { type: "string", description: "Path relatif dari project root" },
            content: { type: "string", description: "Konten file (untuk write action)" },
            old_string: { type: "string", description: "String yang ingin diganti (untuk edit action)" },
            new_string: { type: "string", description: "String pengganti (untuk edit action)" },
          },
          required: ["action", "path"],
        },
        description: "Daftar operasi file yang akan dilakukan secara berurutan",
      },
      commit_message: { type: "string", description: "Kalo diisi, auto-commit setelah perubahan" },
    },
    required: ["files"],
  },
  handler: async (params): Promise<ToolResult> => {
    try {
      const files = params.files as { action: string; path: string; content?: string; old_string?: string; new_string?: string }[];
      const results: Record<string, unknown> = {};

      for (const file of files) {
        const fullPath = path.join(PROJECT_ROOT, file.path);

        if (file.action === "read") {
          const content = await fs.readFile(fullPath, "utf-8");
          results[file.path] = content;
        } else if (file.action === "write") {
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          await fs.writeFile(fullPath, file.content || "", "utf-8");
          results[file.path] = "written";
        } else if (file.action === "edit") {
          if (!file.old_string || !file.new_string) {
            return { success: false, error: `edit action requires old_string and new_string for ${file.path}` };
          }
          const existing = await fs.readFile(fullPath, "utf-8");
          if (!existing.includes(file.old_string)) {
            return { success: false, error: `old_string not found in ${file.path}` };
          }
          const updated = existing.replace(file.old_string, file.new_string);
          await fs.writeFile(fullPath, updated, "utf-8");
          results[file.path] = "edited";
        }
      }

      if (params.commit_message) {
        const relativePaths = files.map((f) => f.path).join(" ");
        await execAsync(
          `cd ${PROJECT_ROOT} && git add ${relativePaths} && git commit -m "${String(params.commit_message).replace(/"/g, '\\"')}"`,
          { timeout: 15000 }
        );
        results._commit = String(params.commit_message);
      }

      return { success: true, data: results };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
};
