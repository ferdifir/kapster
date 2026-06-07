# Fase 1: Database + Agent Core

## Tujuan
Bikin fondasi agent system: table di Supabase, base class agent, task CRUD API.

## Deliverable
- 3 tabel baru di Supabase
- Base class `Agent` di `lib/agents/core/agent.ts`
- API routes `/api/agents/tasks` + `/api/agents/memory`
- Bisa create/list/update task

## Database

```sql
create table agent_tasks (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  parent_task_id uuid references agent_tasks(id),
  sub_agent_id text,
  title text not null,
  description text,
  status text not null default 'pending', -- pending, in_progress, completed, failed, checkpoint, blocked
  score integer,
  auto_executed boolean default false,
  escalation jsonb,                        -- { reason, what_i_need, requested_at }
  checkpoint_data jsonb,
  token_usage integer,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  task_id uuid references agent_tasks(id),
  action text not null,
  details jsonb,
  created_at timestamp default now()
);

create table agent_memory (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  key text not null,
  value jsonb not null,
  expires_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique(agent_id, key)
);
```

## File Structure

```
lib/agents/
├── core/
│   └── agent.ts          # Base class
├── schema.sql            # SQL migration
└── index.ts              # Re-export

app/api/agents/
├── tasks/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/route.ts     # GET, PATCH (update status)
└── memory/
    └── route.ts          # POST (set), GET (get by key)
```

## Verification
- Run SQL migration di Supabase
- `curl /api/agents/tasks` → return `[]`
- `curl -X POST /api/agents/tasks -d '{"agent_id":"coo","title":"test"}'` → return task id
- `curl /api/agents/memory?agent_id=coo&key=test` → return value
