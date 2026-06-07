import { readFileSync, writeFileSync, unlinkSync, readdirSync } from "fs";
import { join, relative, normalize } from "path";
import { logError } from "@/lib/error-logger";

const PROJECT_ROOT = process.cwd();

function resolvePath(filePath: string): string {
  const resolved = normalize(join(PROJECT_ROOT, filePath));
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error(`Path traversal detected: ${filePath}`);
  }
  return resolved;
}

export async function readFile(filePath: string): Promise<string> {
  try {
    const fullPath = resolvePath(filePath);
    return readFileSync(fullPath, "utf-8");
  } catch (error) {
    logError("hacker/fs-read", error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    const fullPath = resolvePath(filePath);
    writeFileSync(fullPath, content, "utf-8");
  } catch (error) {
    logError("hacker/fs-write", error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const fullPath = resolvePath(filePath);
    unlinkSync(fullPath);
  } catch (error) {
    logError("hacker/fs-delete", error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function listFiles(dir: string, pattern?: string): Promise<string[]> {
  try {
    const fullPath = resolvePath(dir);
    const entries = readdirSync(fullPath, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => relative(PROJECT_ROOT, join(fullPath, e.name)));

    if (pattern) {
      const regex = new RegExp(pattern);
      return files.filter((f) => regex.test(f));
    }

    return files;
  } catch (error) {
    logError("hacker/fs-list", error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
