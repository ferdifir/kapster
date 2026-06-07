import { execSync } from "child_process";
import { logError } from "@/lib/error-logger";

export interface TestResult {
  passed: boolean;
  output: string;
  durationMs: number;
}

export async function runTests(): Promise<TestResult> {
  const start = Date.now();

  try {
    const output = execSync("npm test 2>&1 || pnpm test 2>&1 || true", {
      encoding: "utf-8",
      timeout: 120000,
    });

    const durationMs = Date.now() - start;
    const passed = !output.includes("FAIL") && !output.includes("failed");

    return { passed, output, durationMs };
  } catch (error) {
    logError("test-gate", error instanceof Error ? error : new Error(String(error)));
    return { passed: false, output: String(error), durationMs: Date.now() - start };
  }
}

export async function runBuildCheck(): Promise<TestResult> {
  const start = Date.now();

  try {
    const output = execSync("npm run build 2>&1 || pnpm build 2>&1 || true", {
      encoding: "utf-8",
      timeout: 300000,
    });

    const durationMs = Date.now() - start;
    const passed = output.includes("Compiled successfully") || output.includes("ready");

    return { passed, output, durationMs };
  } catch (error) {
    logError("test-gate/build", error instanceof Error ? error : new Error(String(error)));
    return { passed: false, output: String(error), durationMs: Date.now() - start };
  }
}
