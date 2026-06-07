import { Agent, type Task } from "../core/agent";

export interface ApprovalItem {
  id: string;
  taskId: string;
  score: number;
  proposedBy: string;
  summary: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const APPROVAL_KEY = "approval_queue";

export async function addToQueue(
  taskId: string,
  score: number,
  proposedBy: string,
  summary: string
): Promise<string> {
  const agent = new Agent("coo");
  const existing = (await agent.getMemory(APPROVAL_KEY)) as ApprovalItem[] ?? [];

  const id = `approval-${Date.now()}`;
  const item: ApprovalItem = {
    id,
    taskId,
    score,
    proposedBy,
    summary,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  existing.push(item);
  await agent.setMemory(APPROVAL_KEY, existing);

  await agent.log({
    agent_id: "coo",
    action: "approval_requested",
    details: { approvalId: id, taskId, score, proposedBy },
  });

  return id;
}

export async function getPending(): Promise<ApprovalItem[]> {
  const agent = new Agent("coo");
  const all = (await agent.getMemory(APPROVAL_KEY)) as ApprovalItem[] ?? [];
  return all.filter((a) => a.status === "pending");
}

export async function approve(id: string): Promise<void> {
  const agent = new Agent("coo");
  const all = (await agent.getMemory(APPROVAL_KEY)) as ApprovalItem[] ?? [];
  const item = all.find((a) => a.id === id);

  if (!item) throw new Error("Approval not found");

  item.status = "approved";

  // Update task status
  const task = await agent.getTask(item.taskId);
  if (task) {
    await agent.updateTask(item.taskId, { status: "in_progress" } as Partial<Task>);
  }

  await agent.setMemory(APPROVAL_KEY, all);

  await agent.log({
    agent_id: "coo",
    action: "approval_granted",
    details: { approvalId: id, taskId: item.taskId },
  });
}

export async function reject(id: string): Promise<void> {
  const agent = new Agent("coo");
  const all = (await agent.getMemory(APPROVAL_KEY)) as ApprovalItem[] ?? [];
  const item = all.find((a) => a.id === id);

  if (!item) throw new Error("Approval not found");

  item.status = "rejected";

  const task = await agent.getTask(item.taskId);
  if (task) {
    await agent.updateTask(item.taskId, {
      status: "cancelled",
    } as Partial<Task>);
  }

  await agent.setMemory(APPROVAL_KEY, all);

  await agent.log({
    agent_id: "coo",
    action: "approval_rejected",
    details: { approvalId: id, taskId: item.taskId },
  });
}
