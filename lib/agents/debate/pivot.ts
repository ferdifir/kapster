import { Agent } from "../core/agent";
import { initiate as initiateDebate } from "./orchestrator";

export interface PivotSignal {
  source: string;
  metric: string;
  severity: "low" | "medium" | "high" | "critical";
  evidence: string;
}

export async function detectPivotSignal(): Promise<PivotSignal | null> {
  const agent = new Agent("coo");

  // Check for common pivot signals
  const signals: PivotSignal[] = [];

  // High churn detection
  const churnLogs = await agent.getLogs("hustler", 10);
  const churnMentions = JSON.stringify(churnLogs).toLowerCase();

  if (churnMentions.includes("churn") && churnMentions.includes("15")) {
    signals.push({
      source: "hustler",
      metric: "churn_rate",
      severity: "high",
      evidence: "Churn rate mentioned in logs near threshold",
    });
  }

  // Failed builds (technical debt)
  const hackerLogs = await agent.getLogs("hacker", 10);
  const buildFails = (hackerLogs as Array<{ action: string }>).filter(
    (l) => l.action === "build_failed"
  );

  if (buildFails.length >= 3) {
    signals.push({
      source: "hacker",
      metric: "build_failures",
      severity: "medium",
      evidence: `${buildFails.length} consecutive build failures`,
    });
  }

  return signals.length > 0 ? signals[0] : null;
}

export async function escalateToPivotDebate(signal: PivotSignal): Promise<string> {
  const agent = new Agent("coo");

  await agent.log({
    agent_id: "coo",
    action: "pivot_signal_detected",
    details: signal as unknown as Record<string, unknown>,
  });

  const debateId = await initiateDebate(
    `PIVOT SIGNAL: ${signal.metric} (${signal.severity}) — ${signal.evidence}`,
    ["coo", "hacker", "hipster", "hustler"],
    "coo"
  );

  return debateId;
}
