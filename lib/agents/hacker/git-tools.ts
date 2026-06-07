import { execSync } from "child_process";
import { logError } from "@/lib/error-logger";

const PROJECT_ROOT = process.cwd();

function run(cmd: string): string {
  return execSync(cmd, { cwd: PROJECT_ROOT, encoding: "utf-8" }).trim();
}

function sanitizeBranchName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export interface GitStatus {
  branch: string;
  hasChanges: boolean;
  files: string[];
}

export async function createBranch(taskId: string, title: string): Promise<string> {
  const branchName = `agent-staging/hacker/${taskId}-${sanitizeBranchName(title)}`;

  run(`git checkout main`);
  run(`git pull origin main 2>/dev/null || true`);
  run(`git checkout -b ${branchName}`);

  return branchName;
}

export async function commitAndPush(files: string[], message: string): Promise<void> {
  files = [...new Set(files)];

  for (const file of files) {
    if (!file.startsWith(PROJECT_ROOT)) {
      throw new Error(`File path outside project root: ${file}`);
    }
  }

  for (const file of files) {
    run(`git add "${file}"`);
  }

  run(`git commit -m "${message.replace(/"/g, '\\"')}"`);
  run(`git push origin HEAD`);
}

export async function createPr(title: string, description: string): Promise<string> {
  const cmd = `gh pr create --title "${title.replace(/"/g, '\\"')}" --body "${description.replace(/"/g, '\\"')}"`;
  const url = run(cmd);
  return url;
}

export async function getStatus(): Promise<GitStatus> {
  const branch = run(`git rev-parse --abbrev-ref HEAD`);
  const status = run(`git status --porcelain`);
  const files = status ? status.split("\n").map((l) => l.trim().split(/\s+/)[1]) : [];

  return {
    branch,
    hasChanges: files.length > 0,
    files,
  };
}

export async function cleanupBranch(branchName: string): Promise<void> {
  try {
    run(`git checkout main`);
    run(`git branch -D ${branchName} 2>/dev/null || true`);
  } catch (error) {
    logError("hacker/git-cleanup", error instanceof Error ? error : new Error(String(error)));
  }
}
