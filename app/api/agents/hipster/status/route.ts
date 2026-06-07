import { NextResponse } from "next/server";
import { Agent } from "@/lib/agents";

export async function GET() {
  const agent = new Agent("hipster");
  const tasks = await agent.listTasks("hipster", "in_progress");
  return NextResponse.json({ inProgress: tasks.length });
}
