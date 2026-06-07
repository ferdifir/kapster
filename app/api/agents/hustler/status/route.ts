import { NextResponse } from "next/server";
import { Agent } from "@/lib/agents";

export async function GET() {
  const agent = new Agent("hustler");
  const tasks = await agent.listTasks("hustler", "in_progress");
  return NextResponse.json({ inProgress: tasks.length });
}
