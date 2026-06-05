export type AgentRole = "hacker" | "hipster" | "hustler";

export type EventType =
  | "system_error"
  | "wa_message"
  | "complaint"
  | "feedback"
  | "telegram_cmd"
  | "telegram_feedback"
  | "queue_event"
  | "signup"
  | "scheduled"
  | "tool_call"
  | "code_change"
  | "retrospective";

export type EventSource =
  | "system"
  | "whatsapp"
  | "feedback"
  | "telegram"
  | "app"
  | "cron"
  | "agent";

export type EventStatus = "pending" | "processing" | "processed" | "failed";

export interface AgentEvent {
  id: string;
  event_type: EventType;
  source: EventSource;
  payload: Record<string, unknown>;
  priority: number;
  target_agent?: AgentRole | null;
  status: EventStatus;
  assigned_agent?: AgentRole | null;
  decision?: Record<string, unknown> | null;
  actions_taken?: Record<string, unknown>[];
  report_sent?: boolean;
  notes?: string | null;
  error?: string | null;
  created_at: string;
  processed_at?: string | null;
}

export interface AgentEventInsert {
  event_type: EventType;
  source: EventSource;
  payload?: Record<string, unknown>;
  priority?: number;
  target_agent?: AgentRole | null;
}

export type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (params: Record<string, unknown>) => Promise<ToolResult>;
};

export type PlanStatus = "active" | "paused" | "completed" | "cancelled";
export type PlanStepStatus = "pending" | "awaiting_approval" | "approved" | "in_progress" | "completed" | "skipped";

export interface Plan {
  id: string;
  agent_role: AgentRole;
  title: string;
  description?: string | null;
  status: PlanStatus;
  metrics: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface PlanStep {
  id: string;
  plan_id: string;
  step_order: number;
  title: string;
  description?: string | null;
  status: PlanStepStatus;
  action_type: string;
  action_config: Record<string, unknown>;
  result?: Record<string, unknown> | null;
  approved_by?: string | null;
  created_at: string;
  approved_at?: string | null;
  completed_at?: string | null;
}

export type AgentDecision = {
  reasoning: string;
  action: string;
  tool_calls?: { name: string; params: Record<string, unknown> }[];
  needs_approval?: boolean;
  report_message?: string;
  report_buttons?: { text: string; callback_data: string }[][];
};
