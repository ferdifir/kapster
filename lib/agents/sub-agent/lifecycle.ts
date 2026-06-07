import { Agent, type Task } from "../core/agent";
import * as registry from "./registry";
import type { SubAgentConfig } from "./registry";

export async function createForTask(
  parentAgentId: string,
  task: Task
): Promise<string> {
  const config: SubAgentConfig = {
    name: `task-${task.id.slice(0, 8)}`,
    parentAgentId,
    type: "task",
    description: task.title,
    tokenBudget: 20_000,
    allowedTools: [],
  };

  const id = await registry.register(config);

  const agent = new Agent(parentAgentId);
  await agent.createTask({
    agent_id: parentAgentId,
    parent_task_id: task.id,
    sub_agent_id: id,
    title: task.title,
    description: `Delegated to sub-agent ${id}: ${task.description}`,
  });

  await agent.log({
    agent_id: parentAgentId,
    task_id: task.id,
    action: "task_delegated",
    details: { subAgentId: id },
  });

  return id;
}

export async function createRole(
  parentAgentId: string,
  name: string,
  description: string
): Promise<string> {
  const config: SubAgentConfig = {
    name,
    parentAgentId,
    type: "role",
    description,
    tokenBudget: 30_000,
    allowedTools: [],
  };

  const id = await registry.register(config);

  const agent = new Agent(parentAgentId);
  await agent.log({
    agent_id: parentAgentId,
    action: "role_sub_agent_created",
    details: { subAgentId: id, name, description },
  });

  return id;
}
