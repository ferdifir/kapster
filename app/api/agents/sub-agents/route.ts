import { NextRequest, NextResponse } from "next/server";
import { Agent } from "@/lib/agents";
import * as registry from "@/lib/agents/sub-agent/registry";
import { createForTask, createRole } from "@/lib/agents/sub-agent/lifecycle";

export async function GET() {
  try {
    const all = await registry.list();
    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: "Failed to list sub-agents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.parent_agent_id) {
      return NextResponse.json({ error: "parent_agent_id is required" }, { status: 400 });
    }

    let id: string;

    if (body.type === "role") {
      id = await createRole(body.parent_agent_id, body.name, body.description ?? "");
    } else {
      const agent = new Agent(body.parent_agent_id);
      const task = await agent.createTask({
        agent_id: body.parent_agent_id,
        title: body.name ?? "sub-task",
        description: body.description,
      });
      id = await createForTask(body.parent_agent_id, task);
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create sub-agent" }, { status: 500 });
  }
}
