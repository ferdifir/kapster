import { CooAgent } from "../coo/coo-agent";
import { resetTokenBudget, checkLowToken, getDefaultBudget } from "./token-budget";
import { Agent } from "../core/agent";

export async function startDailyCycle(): Promise<string> {
  const coo = new CooAgent();
  const agent = new Agent("coo");

  await agent.log({
    agent_id: "coo",
    action: "daily_cycle_started",
    details: { time: new Date().toISOString(), budgetPerAgent: getDefaultBudget() },
  });

  // Reset token budget
  await resetTokenBudget();

  await agent.log({
    agent_id: "coo",
    action: "token_budget_reset",
    details: { budget: getDefaultBudget() },
  });

  // Run standup
  const summary = await coo.standup();

  // Check for any low token warnings
  const low = await checkLowToken();
  if (low.length > 0) {
    await agent.log({
      agent_id: "coo",
      action: "low_token_warning",
      details: { agents: low },
    });
  }

  return summary;
}
