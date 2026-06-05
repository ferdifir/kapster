# Agent Planning Layer — Design

## Problem

Current agent architecture is purely **reactive** — agents only respond to incoming events. They have no ability to:
- Set long-term goals ("increase barbershop registrations by 20% this month")
- Track progress toward KPIs over days/weeks
- Maintain persistent plans with milestones
- Proactively work toward business objectives

This limits the agents' usefulness as autonomous operators of the kapster platform.

## Solution: Planning Layer

Add a **persistent planning system** on top of the existing event-driven architecture. Agents can autonomously create plans with steps, and each step requires Ferdi's approval before execution. A daily cron reviews active plans and advances them.

### Key Principles

1. **Agent-initiated** — Agent creates a plan whenever it identifies a need (via event, Telegram command, or daily review)
2. **Step-level approval** — Every plan step needs Ferdi's explicit approval via Telegram inline buttons
3. **Daily review cycle** — pg_cron triggers a daily plan review event per agent with active plans
4. **Persistent state** — Plans and steps live in PostgreSQL, survive restarts
5. **All agents** — Hustler (growth), Hacker (tech debt), Hipster (brand) each maintain their own plans

## New Tables

### `agent_plans`

| Column | Type | Description |
|---|---|---|
| id | uuid PK | |
| agent_role | text | `hacker`, `hipster`, `hustler` |
| title | text | Short goal description |
| description | text | Detailed plan |
| status | text | `active`, `paused`, `completed`, `cancelled` |
| metrics | jsonb | KPI tracking: `{ current: 50, target: 60, deadline: "2026-07-05" }` |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| completed_at | timestamptz | Null until completed |

### `agent_plan_steps`

| Column | Type | Description |
|---|---|---|
| id | uuid PK | |
| plan_id | uuid FK → agent_plans | Parent plan |
| step_order | int | Sequence number |
| title | text | Step summary |
| description | text | What to do and why |
| status | text | `pending` → `awaiting_approval` → `approved` → `in_progress` → `completed` / `skipped` |
| action_type | text | `tool_call`, `ask_ferdi` |
| action_config | jsonb | Data for execution: `{ tool: "exec_sql", params: {...} }` |
| result | jsonb | Output after execution |
| approved_by | text | Ferdi's Telegram username |
| created_at | timestamptz | |
| approved_at | timestamptz | |
| completed_at | timestamptz | |

## Flows

### Plan Creation
```
1. Agent (via event processing / Telegram command / daily review) decides a plan is needed
2. Agent calls create_plan tool
   → INSERT agent_plans (status: active)
   → Agent proposes first step via propose_plan_step tool
   → INSERT agent_plan_steps (status: awaiting_approval)
   → Telegram to Ferdi: "📋 Plan: Increase barbershops by 20%
      Step 1: Scrape barbershop leads from Google Maps
      [✅ Setuju] [❌ Tolak]"
3. Ferdi clicks button
   → Webhook handler updates step status → inserts telegram_feedback event
   → Agent picks up feedback → executes step → marks step completed
   → Agent proposes next step → loop
```

### Daily Plan Review (pg_cron)
```
1. pg_cron fires daily → POST to /api/cron/agent-plan-review
2. Endpoint queries active plans grouped by agent_role
3. For each agent with active plans:
   → Insert scheduled:plan_review event with target_agent set
4. Worker picks up events
   → Agent loads active plans + pending steps
   → LLM reviews progress, decides next action
   → May propose new steps (needs Ferdi approval)
   → May update metrics
   → May mark plan as completed
```

### Step Approval Flow (Telegram Callback)
```
1. Agent proposes step → step status = awaiting_approval
2. Telegram sent to Ferdi with inline keyboard: ✅ Setuju / ❌ Tolak
3. Callback data format: plan_approve:step_id:<uuid> or plan_reject:step_id:<uuid>
4. Webhook handler:
   → Updates step status to approved (or skipped for reject)
   → Inserts telegram_feedback event with { step_id, action, plan_id }
5. Worker picks up telegram_feedback:
   → If approved: agent executes step action
   → After execution: marks step completed, proposes next step
```

### Manual Trigger
```
Ferdi sends: "@hustler gimana progress plan barbershop?"
→ telegram_cmd event inserted
→ Router routes to Hustler Agent
→ Agent loads active plans, reports progress
```

## New Tools (Shared — All Agents)

### `create_plan`
Create a new plan with goals and metrics. Does NOT require approval — plan is immediately active. Steps within the plan need individual approval.

Parameters: `{ title, description, metrics?: { current, target, deadline } }`

### `get_plans`
List active plans for the current agent with their steps.

Parameters: `{ status?: "active" | "all" }`

### `propose_plan_step`
Add a new step to an active plan. Step is created with `awaiting_approval` status. Telegram inline keyboard sent to Ferdi.

Parameters: `{ plan_id, title, description, action_type, action_config }`

## New/Modified Files

| File | Action | Description |
|---|---|---|
| `supabase/migrations/20260606_add_agent_plans.sql` | Create | `agent_plans` + `agent_plan_steps` + RLS |
| `lib/agents/types.ts` | Modify | Add Plan, PlanStep, PlanStatus types |
| `lib/agents/tools/plan-tools.ts` | Create | `create_plan`, `get_plans`, `propose_plan_step` |
| `lib/agents/tools/shared-tools.ts` | Modify | Register plan tools |
| `lib/agents/router.ts` | Modify | Add routing rules for `scheduled` events |
| `lib/agents/base-agent.ts` | Modify | Add plan-awareness in event processing |
| `scripts/agent-worker.ts` | Modify | Handle `scheduled:plan_review` events |
| `app/api/cron/agent-plan-review/route.ts` | Create | Daily cron → insert review events |
| `supabase/migrations/20260606_add_plan_review_cron.sql` | Create | Schedule pg_cron for daily review |
| `app/api/telegram/webhook/route.ts` | Modify | Handle `plan_approve`/`plan_reject` callbacks |
| Agent system prompts (3 files) | Modify | Add planning awareness |
