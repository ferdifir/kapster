import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, relative, normalize } from "path";
import { logError } from "@/lib/error-logger";

const PROJECT_ROOT = process.cwd();

const ALLOWED_DIRS = ["app/", "components/", "public/"];

function resolvePath(filePath: string): string {
  const resolved = normalize(join(PROJECT_ROOT, filePath));
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error(`Path traversal detected: ${filePath}`);
  }

  const rel = relative(PROJECT_ROOT, resolved);
  const allowed = ALLOWED_DIRS.some((dir) => rel.startsWith(dir));
  if (!allowed) {
    throw new Error(`Access denied: ${rel} is not in allowed frontend directories`);
  }

  return resolved;
}

export async function readComponent(filePath: string): Promise<string> {
  const fullPath = resolvePath(filePath);
  return readFileSync(fullPath, "utf-8");
}

export async function writeComponent(filePath: string, content: string): Promise<void> {
  const fullPath = resolvePath(filePath);
  writeFileSync(fullPath, content, "utf-8");
}

export async function listComponents(dir: string): Promise<string[]> {
  const fullPath = resolvePath(dir);
  const entries = readdirSync(fullPath, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && (e.name.endsWith(".tsx") || e.name.endsWith(".css")))
    .map((e) => relative(PROJECT_ROOT, join(fullPath, e.name)));
}

export function isFrontendFile(filePath: string): boolean {
  try {
    resolvePath(filePath);
    return true;
  } catch {
    return false;
  }
}
