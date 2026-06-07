import { Agent, type Task } from "../core/agent";
import { askLlm } from "../llm/groq";
import { calculateScore, evaluateThreshold } from "../coo/scoring";
import fs from "fs";
import path from "path";

const PERSONA_PATH = path.join(process.cwd(), "agents", "coo-context.md");

function loadPersona(): string {
  try {
    return fs.readFileSync(PERSONA_PATH, "utf-8");
  } catch {
    return "You are COO of Kapster startup.";
  }
}

export interface DebateArgument {
  agentId: string;
  position: "for" | "against" | "neutral";
  reasoning: string;
  dataPoints?: string[];
}

export interface DebateSession {
  id: string;
  topic: string;
  participants: string[];
  initiatedBy: string;
  scope: "partial" | "full";
  status: "active" | "resolved" | "cancelled";
  arguments: DebateArgument[];
  resolution?: {
    decision: string;
    score: number;
    reasoning: string;
  };
}

const SESSION_KEY = "debate_sessions";

export async function initiate(topic: string, participants: string[], initiatedBy: string): Promise<string> {
  const agent = new Agent("coo");
  const existing = (await agent.getMemory(SESSION_KEY)) as DebateSession[] ?? [];

  const scope = participants.length >= 3 ? "full" : "partial";
  const id = `debate-${Date.now()}`;

  const session: DebateSession = {
    id,
    topic,
    participants,
    initiatedBy,
    scope,
    status: "active",
    arguments: [],
  };

  existing.push(session);
  await agent.setMemory(SESSION_KEY, existing);

  await agent.log({
    agent_id: "coo",
    action: "debate_initiated",
    details: { debateId: id, topic, participants, scope },
  });

  return id;
}

export async function submitArgument(
  debateId: string,
  argument: DebateArgument
): Promise<DebateSession> {
  const agent = new Agent("coo");
  const all = (await agent.getMemory(SESSION_KEY)) as DebateSession[] ?? [];
  const session = all.find((s) => s.id === debateId);
  if (!session) throw new Error("Debate not found");

  session.arguments.push(argument);

  // Check if all participants have submitted
  const participantSet = new Set(session.arguments.map((a) => a.agentId));

  if (session.participants.every((p) => participantSet.has(p))) {
    // Resolve debate
    const summary = session.arguments.map((a) => `[${a.agentId}] ${a.position}: ${a.reasoning}`).join("\n");

    const result = await askLlm(
      [
        { role: "system", content: loadPersona() },
        {
          role: "user",
          content: `Resolve this debate:\nTopic: ${session.topic}\n\nArguments:\n${summary}\n\nReturn JSON: { "decision": "proceed" | "reject" | "modify", "reasoning": "why" }`,
        },
      ],
      { temperature: 0.2, maxTokens: 500, responseFormat: "json" }
    );

    const decision = JSON.parse(result);
    const score = calculateScore({
      title: session.topic,
      description: decision.reasoning,
      agentId: "coo",
    });

    session.status = "resolved";
    session.resolution = {
      decision: decision.decision,
      score: score.score,
      reasoning: decision.reasoning,
    };

    const threshold = evaluateThreshold(score.score);
    await agent.log({
      agent_id: "coo",
      action: "debate_resolved",
      details: {
        debateId,
        decision: decision.decision,
        score: score.score,
        threshold,
      },
    });
  }

  await agent.setMemory(SESSION_KEY, all);
  return session;
}

export async function getSession(debateId: string): Promise<DebateSession | null> {
  const agent = new Agent("coo");
  const all = (await agent.getMemory(SESSION_KEY)) as DebateSession[] ?? [];
  return all.find((s) => s.id === debateId) ?? null;
}

export async function listSessions(): Promise<DebateSession[]> {
  const agent = new Agent("coo");
  return (await agent.getMemory(SESSION_KEY)) as DebateSession[] ?? [];
}
