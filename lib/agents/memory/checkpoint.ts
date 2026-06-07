import { Agent, type Task } from "../core/agent";

export interface Checkpoint {
  agentId: string;
  taskId: string;
  progress: string;
  context: string;
  tokenUsed: number;
  timestamp: string;
}

export async function saveCheckpoint(
  taskId: string,
  progress: string,
  context: string,
  tokenUsed: number
): Promise<void> {
  const agent = new Agent("coo");
  const task = await agent.getTask(taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const checkpoint: Checkpoint = {
    agentId: task.agent_id,
    taskId,
    progress,
    context,
    tokenUsed,
    timestamp: new Date().toISOString(),
  };

  await agent.updateTask(taskId, {
    status: "checkpoint",
    checkpoint_data: checkpoint as unknown as Record<string, unknown>,
  } as Partial<Task>);

  await agent.log({
    agent_id: task.agent_id,
    task_id: taskId,
    action: "checkpoint_saved",
    details: { progress, tokenUsed },
  });
}

export async function resumeFromCheckpoint(taskId: string): Promise<Checkpoint | null> {
  const agent = new Agent("coo");
  const task = await agent.getTask(taskId);

  if (!task?.checkpoint_data) return null;

  await agent.updateTask(taskId, {
    status: "in_progress",
  } as Partial<Task>);

  return task.checkpoint_data as unknown as Checkpoint;
}
