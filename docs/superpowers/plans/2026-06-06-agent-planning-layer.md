# Agent Planning Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) for syntax checking.

**Goal:** Add persistent planning capability to the 3 AI agent system — agents can create goals, propose steps, and execute with Ferdi's approval.

**Architecture:** New `agent_plans` + `agent_plan_steps` tables. Agents use `create_plan`, `get_plans`, `propose_plan_step` tools. Daily pg_cron triggers plan review events. Ferdi approves/rejects steps via Telegram inline buttons.

**Dependency:** Requires the base 3 AI agent system (event bus, worker, agents) already deployed.

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260606_add_agent_plans.sql`

Create two new tables with RLS:

```sql
-- agent_plans: persistent goals/plans per agent
CREATE TABLE IF NOT EXISTS agent_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_role TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- agent_plan_steps: individual steps per plan
CREATE TABLE IF NOT EXISTS agent_plan_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES agent_plans(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  action_type TEXT NOT NULL DEFAULT 'tool_call',
  action_config JSONB DEFAULT '{}'::jsonb,
  result JSONB,
  approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_agent_plans_role_status ON agent_plans (agent_role, status);
CREATE INDEX idx_agent_plan_steps_plan ON agent_plan_steps (plan_id, step_order);

ALTER TABLE agent_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_plan_steps ENABLE ROW LEVEL SECURITY;

-- Superadmin read access
CREATE POLICY "superadmin_read_plans" ON agent_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin')
  );

CREATE POLICY "superadmin_read_plan_steps" ON agent_plan_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin')
  );
```

- [ ] Step 1: Create migration file
- [ ] Step 2: Apply migration to local/dev branch

### Task 2: Types Update

**File:** `lib/agents/types.ts`

Add these types:

```typescript
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
```

- [ ] Step 1: Add types to `lib/agents/types.ts`

### Task 3: Plan Tools

**Files:**
- Create: `lib/agents/tools/plan-tools.ts`
- Modify: `lib/agents/tools/shared-tools.ts`

Create three shared tools:
1. `create_plan` — Agent creates a plan, persists immediately (no approval needed)
2. `get_plans` — Query active plans for current agent
3. `propose_plan_step` — Add step awaiting Ferdi approval (sends Telegram inline keyboard)

```typescript
// lib/agents/tools/plan-tools.ts
import type { ToolDefinition, ToolResult, AgentRole } from "../types";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramInlineKeyboard } from "@/lib/telegram";

function supabaseAny(supabase: ReturnType<typeof createAdminClient>) {
  return supabase as unknown as {
    from: (t: string) => {
      insert: (v: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } };
      select: (c?: string) => {
        eq: (c: string, v: string) => {
          eq: (c: string, v: string) => {
            order: (c: string, d: { ascending: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>
          }
        }
      };
      update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
    }
  };
}
```

For `propose_plan_step`:
- Insert step with status `awaiting_approval`
- Get chat_id from env
- Send Telegram inline keyboard: ✅ Setuju / ❌ Tolak
- Callback data: `plan_approve:step_id:<uuid>` or `plan_reject:step_id:<uuid>`

Register in `shared-tools.ts`:
```typescript
import { createPlanTools } from "./plan-tools";
// In createSharedTools():
const planTools = createPlanTools();
for (const [name, tool] of planTools) {
  tools.set(name, tool);
}
```

- [ ] Step 1: Create `plan-tools.ts` with `create_plan`, `get_plans`, `propose_plan_step`
- [ ] Step 2: Register in `shared-tools.ts`

### Task 4: Routing Update

**File:** `lib/agents/router.ts`

Add routing rules for `scheduled` events:

```typescript
const ROUTE_RULES: Partial<Record<EventType, AgentRole>> = {
  // ... existing rules ...
  scheduled: undefined, // routed by target_agent set by cron endpoint
};
```

Add a function to route `scheduled:plan_review` events based on `payload.target_role`:

```typescript
// In routeEvent():
if (event.event_type === "scheduled" && event.payload?.target_role) {
  return event.payload.target_role as AgentRole;
}
```

- [ ] Step 1: Modify router to handle scheduled events

### Task 5: Daily Cron Endpoint

**Files:**
- Create: `app/api/cron/agent-plan-review/route.ts`
- Create: `supabase/migrations/20260606_add_plan_review_cron.sql`

The cron endpoint:
1. Queries `agent_plans` for active plans, grouped by `agent_role`
2. For each agent role, inserts a `scheduled:plan_review` event into `agent_events`
3. Returns summary

```typescript
// app/api/cron/agent-plan-review/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  // Cast supabase for agent_events queries
  const anySupabase = supabase as unknown as { from: (t: string) => any };
  
  // Get active plans grouped by role
  const { data } = await anySupabase.from("agent_plans").select("agent_role").eq("status", "active");
  if (!data) return NextResponse.json({ ok: true, events: 0 });
  
  const roles = [...new Set(data.map((r: any) => r.agent_role))];
  let inserted = 0;
  
  for (const role of roles) {
    const { error } = await anySupabase.from("agent_events").insert({
      event_type: "scheduled",
      source: "cron",
      target_agent: role,
      payload: { reason: "plan_review", agent_role: role },
      priority: 3,
    });
    if (!error) inserted++;
  }
  
  return NextResponse.json({ ok: true, events: inserted, roles });
}
```

pg_cron migration:
```sql
SELECT cron.schedule(
  'agent-plan-review-job',
  '0 8 * * *',  -- setiap hari jam 8 pagi
  $$SELECT net.http_post(
    url:='https://kapster.my.id/api/cron/agent-plan-review',
    headers:='{"Authorization":"Bearer kpBlogGen2026!","Content-Type":"application/json"}'::jsonb
  )$$
);
```

- [ ] Step 1: Create cron endpoint
- [ ] Step 2: Create pg_cron migration

### Task 6: Telegram Callback Handling

**File:** `app/api/telegram/webhook/route.ts`

Add handler for `plan_approve` and `plan_reject` callbacks:

```typescript
// In the callback handler, after existing agent_feedback handling:
if (parsed.action === "plan_approve" || parsed.action === "plan_reject") {
  const stepId = parsed.payload.step_id;
  const supabase = createAdminClient();
  const anySupabase = supabase as unknown as { from: (t: string) => any };
  
  // Update step status
  await anySupabase.from("agent_plan_steps").update({
    status: parsed.action === "plan_approve" ? "approved" : "skipped",
    approved_by: body.callback_query.from?.username || "unknown",
    approved_at: new Date().toISOString(),
  }).eq("id", stepId);
  
  // Insert telegram_feedback event so agent picks up the approval
  await anySupabase.from("agent_events").insert({
    event_type: "telegram_feedback",
    source: "telegram",
    payload: {
      action: parsed.action,
      step_id: stepId,
      plan_id: parsed.payload.plan_id,
      user: body.callback_query.from?.username,
    },
    priority: 1,
  });
  
  await answerTelegramCallback(callbackId, parsed.action === "plan_approve" ? "✅ Step disetujui" : "⏭️ Step dilewati");
}
```

- [ ] Step 1: Add plan callback handling to webhook

### Task 7: Agent System Prompts Update

**Files:**
- Modify: `lib/agents/hacker-agent.ts`
- Modify: `lib/agents/hipster-agent.ts`
- Modify: `lib/agents/hustler-agent.ts`

Add planning awareness to each agent's system prompt. Append at the end:

```
Planning:
- You can create persistent plans using create_plan tool
- Plans track progress toward long-term goals
- Each step needs Ferdi's approval before execution
- Use get_plans to review your active plans
- On daily review events, load your active plans and propose next steps
- When you identify a business/technical/brand need, create a plan
```

- [ ] Step 1: Update Hacker prompt
- [ ] Step 2: Update Hipster prompt
- [ ] Step 3: Update Hustler prompt

### Task 8: Worker Update for Plan Review Events

**File:** `scripts/agent-worker.ts`

When processing `scheduled:plan_review` events, the agent should load its active plans. Update the `processEvent` function or add a helper.

Actually, `scheduled:plan_review` events are already handled by the existing flow:
1. Event has `target_agent` set → router uses it
2. Agent receives event → LLM processes it
3. System prompt tells agent to review plans

The worker doesn't need changes — the routing + system prompt handle it. The event payload `{ reason: "plan_review" }` gives the agent enough context.

But we need to make sure the event has `target_agent` set so the router doesn't fall through. The cron endpoint already sets `target_agent`.

- [ ] Step 1: Verify worker doesn't need changes (scheduled events already handled by existing flow with target_agent)

### Task 9: Verify + Deploy

- [ ] Step 1: TypeScript compile check
- [ ] Step 2: Apply migrations
- [ ] Step 3: Commit and push

---

## Summary

| Task | Files | Description |
|------|-------|-------------|
| 1 | `20260606_add_agent_plans.sql` | Migration: plan tables + RLS |
| 2 | `lib/agents/types.ts` | Add Plan/PlanStep types |
| 3 | `plan-tools.ts`, `shared-tools.ts` | create_plan, get_plans, propose_plan_step |
| 4 | `lib/agents/router.ts` | Route scheduled events |
| 5 | `agent-plan-review/route.ts`, plan_review_cron.sql | Daily cron endpoint + pg_cron |
| 6 | `app/api/telegram/webhook/route.ts` | Plan approval/rejection callbacks |
| 7 | 3x agent prompt files | Planning awareness in system prompts |
| 8 | `scripts/agent-worker.ts` | Verify no changes needed |
| 9 | — | TSC check + commit |
